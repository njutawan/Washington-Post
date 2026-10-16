import EmbeddedPostgres from 'embedded-postgres';
import { checkProductionHttp } from './http-security-check.mjs';
import { Client } from 'pg';
import { createServer } from 'node:net';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import {
  createUserWithEmail,
  verifyPassword,
  toggleBookmark,
  getBookmarks,
  getUserProfile,
  emptyDB,
} from '../src/lib/db';
import {
  mutateDocument,
  closeDatabase,
  readDocument,
} from '../src/lib/storage';
import {
  createStory,
  transitionStory,
  publishStory,
  updateStory,
  getPublishedArticle,
} from '../src/lib/editorialStore';
import { consumeLimit, acquireConnection } from '../src/lib/rate-limit';
import { backupApplication, restoreApplication } from '../src/lib/backup';
import type { Actor } from '../src/lib/editorialAuth';
if (process.platform === 'linux')
  process.env.LD_LIBRARY_PATH =
    path.resolve(
      'node_modules/@embedded-postgres/linux-' + process.arch + '/native/lib',
    ) +
    ':' +
    (process.env.LD_LIBRARY_PATH || '');
const dir = await mkdtemp(path.join(tmpdir(), 'wp-pg-drill-'));
const free = createServer();
await new Promise<void>((r) => free.listen(0, '127.0.0.1', r));
const port = (free.address() as { port: number }).port;
await new Promise<void>((r) => free.close(() => r()));
const password = randomBytes(32).toString('hex');
const pg = new EmbeddedPostgres({
  databaseDir: path.join(dir, 'cluster'),
  user: 'postgres',
  password,
  port,
  persistent: false,
  authMethod: 'scram-sha-256',
  postgresFlags: [
    '-c',
    'listen_addresses=127.0.0.1',
    '-c',
    'max_connections=50',
  ],
  onLog: () => {},
  onError: () => {},
});
const source = `postgresql://postgres:${password}@127.0.0.1:${port}/source`;
const target = `postgresql://postgres:${password}@127.0.0.1:${port}/restored`;
const operator = new Client({ connectionString: source });
const runtimePassword = randomBytes(32).toString('hex');
const runtime = `postgresql://app_runtime:${runtimePassword}@127.0.0.1:${port}/source`;
const key = randomBytes(32).toString('hex');
const file = path.join(dir, 'snapshot.backup.enc');
const passphrase = 'integration-drill-passphrase-2026';
process.env.APP_TENANT_ID = 'drill';
let started = false;
let operatorConnected = false;
function report(name: string) {
  console.log('PASS ' + name);
}
function worker() {
  return new Promise<number>((resolve, reject) => {
    const p = spawn(
      process.execPath,
      ['--import', 'tsx', 'scripts/limit-worker.mts'],
      { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let out = '';
    p.stdout.on('data', (chunk) => {
      out += String(chunk);
    });
    p.stderr.resume();
    p.on('error', reject);
    p.on('exit', (code) => {
      if (code !== 0) return reject(Error('Worker failed'));
      try {
        resolve(JSON.parse(out.trim()).accepted);
      } catch {
        reject(Error('Invalid worker result'));
      }
    });
  });
}
try {
  await pg.initialise();
  await pg.start();
  started = true;
  await pg.createDatabase('source');
  await pg.createDatabase('restored');
  await operator.connect();
  operatorConnected = true;
  const schema = await readFile('database/001-security.sql', 'utf8');
  await operator.query(schema);
  const restoreClient = new Client({ connectionString: target });
  await restoreClient.connect();
  await restoreClient.query(schema);
  await restoreClient.end();
  // Credentials are random safe hex, never untrusted request strings.
  await operator.query(
    `CREATE ROLE app_runtime LOGIN PASSWORD '${runtimePassword}'`,
  );
  await operator.query('GRANT CONNECT ON DATABASE source TO app_runtime');
  await operator.query('GRANT USAGE ON SCHEMA public TO app_runtime');
  await operator.query(
    'GRANT SELECT,INSERT,UPDATE ON app_documents TO app_runtime',
  );
  await operator.query('GRANT SELECT,INSERT ON security_audit TO app_runtime');
  await operator.query(
    'GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO app_runtime',
  );
  await operator.query(
    'GRANT SELECT,INSERT,UPDATE,DELETE ON security_limits,security_leases TO app_runtime',
  );
  process.env.DATABASE_URL = runtime;
  const user = await createUserWithEmail({
    email: 'drill@example.invalid',
    password: passphrase,
  });
  await toggleBookmark(user.id, 'restored-bookmark');
  await mutateDocument('accounts', emptyDB(), (db) => {
    db.users.find((u) => u.id === user.id)!.role = 'author';
  });
  const author: Actor = {
    id: user.id,
    name: 'Author',
    email: user.email,
    role: 'author',
    tenantId: 'drill',
  };
  const editor: Actor = { ...author, id: 'editor-operator', role: 'editor' };
  const story = await createStory(
    { title: 'Restore drill', category: 'Test', categorySlug: 'test' },
    author,
  );
  await assert.rejects(
    updateStory(
      story.id,
      {
        title: 'x',
        slug: '../../escape',
        dek: '',
        kicker: '',
        category: 'T',
        categorySlug: 'test',
        priority: 'routine',
        body: 'x',
      },
      author,
    ),
  );
  await assert.rejects(transitionStory(story.id, 'published', author));
  await transitionStory(story.id, 'editing', author);
  await transitionStory(story.id, 'ready', editor);
  await publishStory(story.id, editor);
  report(
    'PostgreSQL CMS roles/state, invalid slug rejection, transactional audit',
  );
  process.env.TEST_ACCOUNT_ID = user.id;
  const counts = await Promise.all([worker(), worker()]);
  assert.equal(
    counts.reduce((a, b) => a + b, 0),
    30,
  );
  assert.equal((await getBookmarks(user.id)).length, 21);
  report(
    'two separate Node processes share atomic limiter (30/40 accepted) and retain all 20 concurrent bookmark updates',
  );
  const leases = await Promise.all(
    Array.from({ length: 5 }, () => acquireConnection('same-client')),
  );
  assert.equal(leases.filter(Boolean).length, 3);
  await Promise.all(leases.filter(Boolean).map((release) => release!()));
  const released = await acquireConnection('same-client');
  assert.ok(released);
  await released();
  const many = await Promise.all(
    Array.from({ length: 105 }, (_, i) => acquireConnection('client-' + i)),
  );
  assert.equal(many.filter(Boolean).length, 100);
  await Promise.all(many.filter(Boolean).map((release) => release!()));
  report('shared connection cap and release (3/client, 100/newsroom)');
  const runtimeClient = new Client({ connectionString: runtime });
  await runtimeClient.connect();
  await assert.rejects(runtimeClient.query('DELETE FROM security_audit'));
  await assert.rejects(
    runtimeClient.query("UPDATE security_audit SET action='tampered'"),
  );
  await runtimeClient.end();
  await assert.rejects(
    operator.query("UPDATE security_audit SET action='tampered'"),
  );
  report(
    'runtime DB role cannot modify/delete audit; immutable trigger rejects operator UPDATE',
  );
  process.env.APP_TENANT_ID = 'foreign';
  assert.equal((await readDocument('accounts', emptyDB())).users.length, 0);
  process.env.APP_TENANT_ID = 'drill';
  report('tenant-scoped document read does not expose another newsroom');
  const beforeAudit = Number(
    (await operator.query('SELECT count(*) AS n FROM security_audit')).rows[0]
      .n,
  );
  const backed = await backupApplication(source, 'drill', key, file);
  assert.equal(backed.documents, 2);
  assert.equal(backed.audit, beforeAudit);
  const encrypted = await readFile(file);
  assert.equal(encrypted.includes(Buffer.from(user.email)), false);
  await assert.rejects(restoreApplication(target, 'foreign', key, file));
  await assert.rejects(
    restoreApplication(target, 'drill', randomBytes(32).toString('hex'), file),
  );
  const corrupt = Buffer.from(encrypted);
  corrupt[corrupt.length - 1] ^= 1;
  const badFile = path.join(dir, 'corrupt.backup.enc');
  await writeFile(badFile, corrupt);
  await assert.rejects(restoreApplication(target, 'drill', key, badFile));
  const t0 = performance.now();
  const restored = await restoreApplication(target, 'drill', key, file);
  assert.equal(restored.audit, beforeAudit);
  await assert.rejects(restoreApplication(target, 'drill', key, file));
  // Restart storage pool, switch DB and exercise real application reads and login.
  await closeDatabase();
  process.env.DATABASE_URL = target;
  assert.equal((await verifyPassword(user.email, passphrase))?.id, user.id);
  assert.deepEqual(
    await getBookmarks(user.id),
    await (async () => {
      const c = new Client({ connectionString: source });
      await c.connect();
      const r = await c.query(
        "SELECT value FROM app_documents WHERE tenant_id='drill' AND key='accounts'",
      );
      await c.end();
      return r.rows[0].value.bookmarks[user.id];
    })(),
  );
  assert.equal((await getUserProfile(user.id))?.id, user.id);
  assert.equal((await getPublishedArticle(story.slug))?.title, story.title);
  const rtoMs = Math.round(performance.now() - t0);
  report(
    `encrypted restore into separate empty PostgreSQL database; password login, bookmarks, published story, audit count verified (restore+checks ${rtoMs} ms)`,
  );
  report(
    'wrong key, tampered ciphertext, wrong tenant and non-empty restore target rejected',
  );
  if (process.argv.includes('--http'))
    await checkProductionHttp(runtime, 'drill');
  console.log(
    JSON.stringify({
      result: 'PASS',
      database: 'PostgreSQL 18 embedded (local isolated)',
      documents: restored.documents,
      auditEvents: restored.audit,
      restoreAndChecksMs: rtoMs,
      productionRestore: false,
    }),
  );
} catch (e) {
  console.error(
    'Security integration failed:',
    e instanceof Error
      ? e.name +
          ': ' +
          e.message.replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[database]')
      : 'unknown',
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
  if (operatorConnected) await operator.end();
  if (started) await pg.stop();
  await rm(dir, { recursive: true, force: true });
}

// Explicit code avoids the embedded cluster exit hook masking a failed test.
process.exit(process.exitCode || 0);
