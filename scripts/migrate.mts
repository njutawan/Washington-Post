import { readFile } from 'node:fs/promises';
import { Client } from 'pg';
const client = new Client({ connectionString: process.env.DATABASE_URL });
try {
  if (!process.env.DATABASE_URL) throw Error('DATABASE_URL required');
  await client.connect();
  await client.query(await readFile('database/001-security.sql', 'utf8'));
  console.log('Schema migration complete');
} catch {
  console.error('Schema migration failed (details intentionally redacted)');
  process.exitCode = 1;
} finally {
  await client.end();
}
