import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { backupApplication, restoreApplication } from '../src/lib/backup';
import { tenantId } from '../src/lib/security-config';
try {
  const [action, file] = process.argv.slice(2);
  const key = process.env.BACKUP_ENCRYPTION_KEY || '';
  if (action === 'create') {
    if (!process.env.BACKUP_DATABASE_URL || !process.env.BACKUP_DIR)
      throw Error('Backup settings required');
    await mkdir(process.env.BACKUP_DIR, { recursive: true, mode: 0o700 });
    const dest = path.join(
      process.env.BACKUP_DIR,
      new Date().toISOString().replace(/[:.]/g, '-') + '.backup.enc',
    );
    const result = await backupApplication(
      process.env.BACKUP_DATABASE_URL,
      tenantId(),
      key,
      dest,
    );
    console.log(JSON.stringify({ file: dest, ...result }));
  } else if (action === 'restore') {
    if (
      !process.env.RESTORE_DATABASE_URL ||
      !file ||
      process.env.CONFIRM_EMPTY_RESTORE !== 'yes'
    )
      throw Error('Explicit empty-target confirmation required');
    // Operator must never point the restore at the live/source database.
    const target = new URL(process.env.RESTORE_DATABASE_URL);
    for (const live of [
      process.env.DATABASE_URL,
      process.env.BACKUP_DATABASE_URL,
    ].filter(Boolean)) {
      const source = new URL(live!);
      if (
        source.hostname === target.hostname &&
        source.port === target.port &&
        source.pathname === target.pathname
      )
        throw Error('Live database restore is forbidden');
    }
    console.log(
      JSON.stringify(
        await restoreApplication(
          process.env.RESTORE_DATABASE_URL,
          tenantId(),
          key,
          file,
        ),
      ),
    );
  } else throw Error('Use create or restore <encrypted-file>');
} catch {
  console.error(
    'Backup/restore failed; inspect configuration and encrypted snapshot. No secrets are logged.',
  );
  process.exitCode = 1;
}
