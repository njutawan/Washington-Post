/** Encrypted application snapshot (not a replacement for provider PITR/base backups).
 * Uses a dedicated operator connection, not the web application's pool/role.
 */
import { Client } from 'pg';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { readFile, writeFile, stat } from 'fs/promises';
import { z } from 'zod';
const magic = Buffer.from('WPBK1');
const docSchema = z
  .object({
    tenant_id: z.string(),
    key: z.enum(['accounts', 'editorial', 'push', 'analytics']),
    value: z.unknown(),
    updated_at: z.string(),
  })
  .strict();
const eventSchema = z
  .object({
    tenant_id: z.string(),
    actor_id: z.string(),
    action: z.string(),
    target_id: z.string(),
    created_at: z.string(),
  })
  .strict();
const snapshotSchema = z
  .object({
    version: z.literal(1),
    tenant: z.string(),
    createdAt: z.string(),
    documents: z.array(docSchema),
    audit: z.array(eventSchema),
  })
  .strict();
function keyFromEnv(key: string) {
  if (!/^[a-f0-9]{64}$/i.test(key))
    throw Error('Backup encryption key must be 32 random bytes (hex)');
  return Buffer.from(key, 'hex');
}
export async function backupApplication(
  url: string,
  tenant: string,
  key: string,
  file: string,
) {
  const c = new Client({ connectionString: url });
  try {
    await c.connect();
    await c.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const documents = (
      await c.query(
        'SELECT tenant_id,key,value,updated_at::text FROM app_documents WHERE tenant_id=$1 ORDER BY key',
        [tenant],
      )
    ).rows;
    const events = (
      await c.query(
        'SELECT tenant_id,actor_id,action,target_id,created_at::text FROM security_audit WHERE tenant_id=$1 ORDER BY id',
        [tenant],
      )
    ).rows;
    await c.query('COMMIT');
    const snapshot = snapshotSchema.parse({
      version: 1,
      tenant,
      createdAt: new Date().toISOString(),
      documents,
      audit: events,
    });
    const serialized = JSON.stringify(snapshot);
    if (Buffer.byteLength(serialized) > 256 * 1024 * 1024 - 33)
      throw Error('Use native database backup for snapshots over 256 MiB');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', keyFromEnv(key), iv);
    const ciphertext = Buffer.concat([
      cipher.update(serialized, 'utf8'),
      cipher.final(),
    ]);
    await writeFile(
      file,
      Buffer.concat([magic, iv, cipher.getAuthTag(), ciphertext]),
      { flag: 'wx', mode: 0o600 },
    );
    return { documents: documents.length, audit: events.length };
  } finally {
    await c.end();
  }
}
export async function restoreApplication(
  url: string,
  tenant: string,
  key: string,
  file: string,
) {
  if ((await stat(file)).size > 256 * 1024 * 1024)
    throw Error('Snapshot exceeds 256 MiB: use native DB restore');
  const bytes = await readFile(file);
  if (!bytes.subarray(0, 5).equals(magic) || bytes.length < 34)
    throw Error('Invalid snapshot');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    keyFromEnv(key),
    bytes.subarray(5, 17),
  );
  decipher.setAuthTag(bytes.subarray(17, 33));
  // Authentication/decryption and schema validation finish BEFORE connecting/writing.
  const decoded = Buffer.concat([
    decipher.update(bytes.subarray(33)),
    decipher.final(),
  ]).toString('utf8');
  const snapshot = snapshotSchema.parse(JSON.parse(decoded));
  if (
    snapshot.tenant !== tenant ||
    snapshot.documents.some((d) => d.tenant_id !== tenant) ||
    snapshot.audit.some((e) => e.tenant_id !== tenant)
  )
    throw Error('Tenant mismatch');
  const c = new Client({ connectionString: url });
  try {
    await c.connect();
    await c.query('BEGIN');
    // Exclusive table lock prevents concurrent web mutations racing the empty-target check.
    await c.query(
      'LOCK TABLE app_documents,security_audit IN ACCESS EXCLUSIVE MODE',
    );
    if (
      Number(
        (
          await c.query(
            'SELECT (SELECT count(*) FROM app_documents)+(SELECT count(*) FROM security_audit) AS n',
          )
        ).rows[0].n,
      ) !== 0
    )
      throw Error('Restore target must be empty');
    for (const d of snapshot.documents)
      await c.query(
        'INSERT INTO app_documents(tenant_id,key,value,updated_at) VALUES($1,$2,$3::jsonb,$4)',
        [tenant, d.key, JSON.stringify(d.value), d.updated_at],
      );
    for (const e of snapshot.audit)
      await c.query(
        'INSERT INTO security_audit(tenant_id,actor_id,action,target_id,created_at) VALUES($1,$2,$3,$4,$5)',
        [tenant, e.actor_id, e.action, e.target_id, e.created_at],
      );
    await c.query('COMMIT');
    return {
      documents: snapshot.documents.length,
      audit: snapshot.audit.length,
    };
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    await c.end();
  }
}
