import { auth } from '@/auth';
import { getStaffIdentity } from './db';
import { tenantId } from './security-config';
import { atLeast, type EditorialRole, type Actor } from './editorialAuth';
import { HttpError } from './http-security';
export async function getActorFromRequest(): Promise<Actor | null> {
  // No catch-and-fallback provider: outages cannot downgrade authentication.
  const session = await auth();
  if (!session?.user?.id || session.user.tenantId !== tenantId()) return null;
  const user = await getStaffIdentity(session.user.id);
  return user ? { ...user, tenantId: tenantId() } : null;
}
export async function requireActor(
  minRole: EditorialRole = 'author',
): Promise<Actor> {
  const u = await getActorFromRequest();
  if (!u) throw new HttpError(401, 'Sign in required');
  if (!atLeast(u.role, minRole)) throw new HttpError(403, 'Forbidden');
  return u;
}
