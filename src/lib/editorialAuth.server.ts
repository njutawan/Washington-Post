/**
 * Shared helper for server actions / route handlers to pull the editorial
 * user from Clerk (or NextAuth demo fallback).
 */
import { resolveRole, resolveUser, type EditorialRole } from './editorialAuth';

export async function getActorFromRequest(): Promise<{ id: string; name: string; email: string; role: EditorialRole } | null> {
  let sess: any = null;
  try {
    if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      const clerk = await import('@clerk/nextjs/server');
      const a = await clerk.auth();
      if (a?.userId) {
        const u = await clerk.currentUser().catch(() => null);
        sess = {
          userId: a.userId,
          user: u ? {
            id: u.id,
            email: u.emailAddresses?.[0]?.emailAddress,
            name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.emailAddresses?.[0]?.emailAddress,
            image: u.imageUrl,
          } : { id: a.userId },
          publicMetadata: (u as any)?.publicMetadata,
          organizationMembershipList: (u as any)?.organizationMemberships,
          emailAddresses: u?.emailAddresses,
        };
      }
    }
  } catch { /* Clerk not available */ }
  if (!sess?.userId) {
    try {
      const { auth: na } = await import('@/auth');
      const s = await na();
      if (s?.user?.id) {
        sess = { userId: s.user.id, user: { id: s.user.id, email: s.user.email || undefined, name: s.user.name || undefined, image: s.user.image || undefined } };
      }
    } catch { /* ignore */ }
  }
  const user = resolveUser(sess);
  if (!user) return null;
  return { ...user, role: resolveRole(sess) };
}

export async function requireActor(minRole: EditorialRole = 'author') {
  const u = await getActorFromRequest();
  if (!u) throw new Error('Not authenticated');
  const hierarchy: Record<EditorialRole, number> = { reader: 0, author: 10, editor: 20, admin: 30 };
  if (hierarchy[u.role] < hierarchy[minRole]) throw new Error(`Forbidden: requires ${minRole}`);
  return u;
}
