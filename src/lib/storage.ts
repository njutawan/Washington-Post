import { Pool, type PoolClient } from 'pg';
import { mkdir, readFile, rename, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { tenantId, validateRuntimeConfig } from './security-config';

let pool: Pool | undefined;
export function database(): Pool {
  validateRuntimeConfig();
  if (!process.env.DATABASE_URL) throw new Error('Database unavailable');
  // TLS settings belong in DATABASE_URL (sslmode=verify-full). Never disable cert validation.
  return (pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 8,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
  }));
}
export async function transaction<T>(
  run: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const c = await database().connect();
  try {
    await c.query('BEGIN');
    const out = await run(c);
    await c.query('COMMIT');
    return out;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}
export type AuditEvent = { actorId: string; action: string; targetId: string };
export async function audit(c: PoolClient, event: AuditEvent) {
  await c.query(
    'INSERT INTO security_audit(tenant_id, actor_id, action, target_id) VALUES($1,$2,$3,$4)',
    [tenantId(), event.actorId, event.action, event.targetId],
  );
}
// Development only: serial queue + atomic rename, fresh reads, no cached mutable records.
// Not shared across processes. Production MUST use Postgres.
let localQueue: Promise<unknown> = Promise.resolve();
function localPath(key: string) {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Local storage disabled in production');
  if (!/^[a-z-]+$/.test(key)) throw new Error('Invalid storage key');
  return path.join(
    process.env.LOCAL_DATA_DIR || '.local-data',
    tenantId(),
    key + '.json',
  );
}
async function localRead<T>(key: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(localPath(key), 'utf8')) as T;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT')
      return structuredClone(fallback);
    throw e;
  }
}
export async function readDocument<T>(key: string, fallback: T): Promise<T> {
  if (!process.env.DATABASE_URL) {
    await localQueue;
    return localRead(key, fallback);
  }
  const r = await database().query(
    'SELECT value FROM app_documents WHERE tenant_id=$1 AND key=$2',
    [tenantId(), key],
  );
  return (r.rows[0]?.value as T | undefined) ?? structuredClone(fallback);
}
export async function mutateDocument<T, R>(
  key: string,
  fallback: T,
  run: (doc: T) => R | Promise<R>,
  event?: AuditEvent,
): Promise<R> {
  if (process.env.DATABASE_URL)
    return transaction(async (c) => {
      // INSERT first ensures SELECT FOR UPDATE serializes even on an empty DB.
      await c.query(
        'INSERT INTO app_documents(tenant_id,key,value) VALUES($1,$2,$3::jsonb) ON CONFLICT DO NOTHING',
        [tenantId(), key, JSON.stringify(fallback)],
      );
      const r = await c.query(
        'SELECT value FROM app_documents WHERE tenant_id=$1 AND key=$2 FOR UPDATE',
        [tenantId(), key],
      );
      const doc = r.rows[0].value as T;
      const result = await run(doc);
      await c.query(
        'UPDATE app_documents SET value=$3::jsonb,updated_at=now() WHERE tenant_id=$1 AND key=$2',
        [tenantId(), key, JSON.stringify(doc)],
      );
      if (event) await audit(c, event);
      return result;
    });
  const task = localQueue.then(async () => {
    const doc = await localRead(key, fallback);
    const result = await run(doc);
    const dest = localPath(key);
    await mkdir(path.dirname(dest), { recursive: true, mode: 0o700 });
    const tmp = dest + '.' + randomUUID() + '.tmp';
    await writeFile(tmp, JSON.stringify(doc), { mode: 0o600 });
    await rename(tmp, dest);
    // Local audit is development evidence only, not production immutable logging.
    if (event) {
      const { appendFile } = await import('fs/promises');
      await appendFile(
        path.join(path.dirname(dest), 'audit.jsonl'),
        JSON.stringify({ ...event, at: new Date().toISOString() }) + '\n',
        { mode: 0o600 },
      );
    }
    return result;
  });
  localQueue = task.catch(() => undefined);
  return task;
}
export async function closeDatabase() {
  await pool?.end();
  pool = undefined;
}
