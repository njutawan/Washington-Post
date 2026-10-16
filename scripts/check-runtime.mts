import { validateRuntimeConfig } from '../src/lib/security-config';
import { database, closeDatabase } from '../src/lib/storage';
try {
  validateRuntimeConfig();
  if (
    !process.env.BACKUP_OWNER ||
    process.env.BACKUP_OWNER.trim().length < 3 ||
    /^(todo|tbd|example)/i.test(process.env.BACKUP_OWNER)
  )
    throw Error('Name a backup owner');
  for (const field of ['BACKUP_RPO_MINUTES', 'BACKUP_RTO_MINUTES'])
    if (!/^[1-9][0-9]{0,4}$/.test(process.env[field] || ''))
      throw Error('Approve RPO/RTO');
  const r = await database().query(
    "SELECT current_setting('is_superuser') AS superuser",
  );
  if (r.rows[0].superuser === 'on')
    throw Error('Runtime role cannot be superuser');
  await database().query(
    'SELECT 1 FROM app_documents,security_audit,security_limits,security_leases LIMIT 0',
  );
  console.log('Runtime configuration and database ready');
} catch {
  console.error(
    'Runtime preflight failed: validate canonical origin, secrets, tenant, database migrations and least-privilege runtime role.',
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
