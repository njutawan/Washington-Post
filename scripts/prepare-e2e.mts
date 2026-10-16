/** Ephemeral CI-only PostgreSQL fixture; never used to provision production. */
import { Client } from 'pg';
import { randomBytes } from 'node:crypto';
import { readFile, appendFile } from 'node:fs/promises';
if (
  !process.env.CI ||
  !process.env.GITHUB_ENV ||
  !process.env.ADMIN_DATABASE_URL
)
  throw Error('CI fixture only');
const client = new Client({ connectionString: process.env.ADMIN_DATABASE_URL });
const password = randomBytes(32).toString('hex'),
  secret = randomBytes(48).toString('hex');
try {
  await client.connect();
  await client.query(await readFile('database/001-security.sql', 'utf8'));
  await client.query(`CREATE ROLE ci_runtime LOGIN PASSWORD '${password}'`);
  await client.query('GRANT USAGE ON SCHEMA public TO ci_runtime');
  await client.query(
    'GRANT SELECT,INSERT,UPDATE ON app_documents TO ci_runtime',
  );
  await client.query('GRANT SELECT,INSERT ON security_audit TO ci_runtime');
  await client.query(
    'GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO ci_runtime',
  );
  await client.query(
    'GRANT SELECT,INSERT,UPDATE,DELETE ON security_limits,security_leases TO ci_runtime',
  );
  const url = new URL(process.env.ADMIN_DATABASE_URL);
  url.username = 'ci_runtime';
  url.password = password;
  for (const s of [password, secret, url.href]) console.log('::add-mask::' + s);
  await appendFile(
    process.env.GITHUB_ENV,
    `DATABASE_URL=${url.href}\nNEXTAUTH_SECRET=${secret}\nNEXTAUTH_URL=https://localhost:3000\nAPP_TENANT_ID=ci\n`,
  );
} finally {
  await client.end();
}
