import { Client } from 'pg';
const c = new Client({ connectionString: process.env.DATABASE_URL });
try {
  if (!process.env.DATABASE_URL) throw Error('Database required');
  await c.connect();
  await c.query('DELETE FROM security_limits WHERE expires_at<now()');
  await c.query('DELETE FROM security_leases WHERE expires_at<now()');
  console.log('Expired security state removed');
} catch {
  console.error('Security-state cleanup failed');
  process.exitCode = 1;
} finally {
  await c.end();
}
