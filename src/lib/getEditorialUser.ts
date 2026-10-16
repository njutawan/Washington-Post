import { redirect } from 'next/navigation';
import { getActorFromRequest } from './editorialAuth.server';
import { atLeast, ROLE_LABEL, type EditorialRole } from './editorialAuth';
export async function getEditorialUser(minRole: EditorialRole = 'author') {
  const u = await getActorFromRequest();
  if (!u) redirect('/signin?callbackUrl=%2Feditorial');
  if (!atLeast(u.role, minRole)) redirect('/access-denied');
  return {
    ...u,
    image: undefined as string | undefined,
    department: undefined as string | undefined,
    title: undefined as string | undefined,
    roleLabel: ROLE_LABEL[u.role],
  };
}
