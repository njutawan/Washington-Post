import { z } from 'zod';
import { mutateDocument, closeDatabase } from '../src/lib/storage';
import { emptyDB } from '../src/lib/db';
const [id, role] = process.argv.slice(2);
try {
  if (!process.env.DATABASE_URL || !process.env.OPERATOR_ID)
    throw Error('Operator configuration required');
  z.string()
    .regex(/^[a-f0-9]{32}$/)
    .parse(id);
  const r = z.enum(['reader', 'author', 'editor', 'admin']).parse(role);
  await mutateDocument(
    'accounts',
    emptyDB(),
    (db) => {
      const u = db.users.find((u) => u.id === id);
      if (!u) throw Error('Unknown account ID');
      u.role = r;
    },
    {
      actorId: process.env.OPERATOR_ID,
      action: 'staff.role.' + r,
      targetId: id,
    },
  );
  console.log('Role updated; existing sessions use the new role immediately.');
} catch {
  console.error(
    'Role update refused. Supply an existing account ID, valid role, operator ID and database.',
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
