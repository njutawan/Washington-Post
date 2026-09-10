/**
 * Resolve the current editorial user server-side.
 *
 * Tries Clerk's `currentUser()` first; falls back to NextAuth `auth()` (so the
 * CMS still works in the sandbox without Clerk keys). If neither auth has an
 * editorial role, redirects to a "no access" page.
 */
import { redirect } from 'next/navigation';
import { resolveRole, resolveUser, type EditorialRole, ROLE_LABEL } from './editorialAuth';

type CurrentUserResult = {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: EditorialRole;
  roleLabel: string;
  department?: string;
  title?: string;
};

export async function getEditorialUser(minRole: EditorialRole = 'author'): Promise<CurrentUserResult> {
  let sess: any = null;

  // Try Clerk first
  try {
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (clerkKey) {
      const { auth, currentUser } = await import('@clerk/nextjs/server');
      const a = await auth();
      if (a?.userId) {
        const u = await currentUser().catch(() => null);
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
  } catch (e) {
    // Clerk not configured — fall through
  }

  // Fall back to NextAuth
  if (!sess?.userId) {
    try {
      const { auth: na } = await import('@/auth');
      const s = await na();
      if (s?.user?.id) {
        // Merge role from demo env if present
        sess = {
          userId: s.user.id,
          user: { id: s.user.id, email: s.user.email || undefined, name: s.user.name || undefined, image: s.user.image || undefined },
        };
      }
    } catch { /* ignore */ }
  }

  const user = resolveUser(sess);
  const role = resolveRole(sess);

  if (!user) {
    redirect(`/signin?callbackUrl=${encodeURIComponent('/editorial')}`);
  }
  if (!['author', 'editor', 'admin'].includes(role)) {
    redirect('/editorial/no-access');
  }
  // Role hierarchy check
  const hierarchy: Record<EditorialRole, number> = { reader: 0, author: 10, editor: 20, admin: 30 };
  if (hierarchy[role] < hierarchy[minRole]) {
    redirect('/editorial/no-access');
  }
  return { ...user, roleLabel: ROLE_LABEL[role] };
}
