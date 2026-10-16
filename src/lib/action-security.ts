import { requireActor } from './editorialAuth.server';
import { consumeLimit } from './rate-limit';
import { boundedForm } from './security-input';
import type { EditorialRole } from './editorialAuth';
/** Every exported Server Action calls this directly; layouts/UI are not guards. */
export async function actionActor(
  fd: FormData,
  role: EditorialRole = 'author',
) {
  const actor = await requireActor(role);
  boundedForm(fd);
  const limit = await consumeLimit('cms:' + actor.id, 30, 60000);
  if (!limit.allowed) throw new Error('Too many actions; try again later');
  return actor;
}
