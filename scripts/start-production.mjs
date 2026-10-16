import { spawn } from 'node:child_process';
import nextEnv from '@next/env';
import { Client } from 'pg';
import { validateRuntimeConfig } from '../src/lib/security-config.runtime.mjs';
// This is always a production entry point. Next's instrumentation may report an
// initialization error without exiting, so validate BEFORE spawning the server.
process.env.NODE_ENV = 'production';
delete process.env.NEXT_PHASE;
nextEnv.loadEnvConfig(process.cwd(), false);
try {
  validateRuntimeConfig();
} catch (error) {
  // Validator messages are fixed strings, never include supplied secret values.
  console.error(
    '[startup] ' +
      (error instanceof Error ? error.message : 'Invalid configuration'),
  );
  process.exit(1);
}
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  statement_timeout: 5000,
});
try {
  await client.connect();
  const role =
    await client.query(`SELECT current_setting('is_superuser') AS superuser,
    has_table_privilege(current_user,'security_audit','UPDATE') OR
    has_table_privilege(current_user,'security_audit','DELETE') OR
    has_table_privilege(current_user,'security_audit','TRUNCATE') AS audit_mutable`);
  if (role.rows[0].superuser === 'on' || role.rows[0].audit_mutable)
    throw new Error('Unsafe runtime role');
  await client.query(
    'SELECT 1 FROM app_documents,security_audit,security_limits,security_leases LIMIT 0',
  );
} catch {
  console.error(
    '[startup] Database unavailable, schema missing or runtime role is overprivileged',
  );
  await client.end().catch(() => undefined);
  process.exit(1);
}
await client.end();
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'start', ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env },
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.on(signal, () => child.kill(signal));
child.on('error', () => {
  console.error('[startup] Server process failed');
  process.exit(1);
});
child.on('exit', (code) => process.exit(code ?? 1));
