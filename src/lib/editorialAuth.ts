/**
 * Editorial role resolution + guards.
 *
 * Roles are sourced, in order:
 *  1. Clerk session publicMetadata.role  (production: editors/admins set via Clerk Dashboard
 *     or Organization Membership with role 'admin' / 'editor' / 'author').
 *  2. NEXT_PUBLIC_DEMO_EDITOR_ROLE env var (sandbox/demo — lets reviewers access the CMS
 *     without configuring Clerk org roles). Values: 'admin' | 'editor' | 'author' | 'reader'.
 *  3. Default: 'reader' (no CMS access).
 */
export type EditorialRole = 'reader' | 'author' | 'editor' | 'admin';

export const ROLE_LABEL: Record<EditorialRole, string> = {
  reader: 'Reader',
  author: 'Reporter / Author',
  editor: 'Editor',
  admin: 'Managing Editor / Admin',
};

export const ROLE_HIERARCHY: Record<EditorialRole, number> = {
  reader: 0,
  author: 10,
  editor: 20,
  admin: 30,
};

export function atLeast(userRole: EditorialRole, required: EditorialRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[required];
}

export type SessionLike = {
  userId?: string | null;
  user?: { id?: string | null; email?: string | null; name?: string | null; image?: string | null } | null;
  publicMetadata?: { role?: EditorialRole | string; department?: string; title?: string } | null;
  organizationMembershipList?: Array<{ role?: string }> | null;
  emailAddresses?: Array<{ emailAddress?: string }> | null;
};

export function resolveRole(sess: SessionLike | null | undefined): EditorialRole {
  if (!sess?.userId && !sess?.user?.id) return 'reader';
  // 1. Clerk publicMetadata.role
  const meta = sess.publicMetadata as any;
  if (meta?.role && typeof meta.role === 'string') {
    const r = meta.role.toLowerCase();
    if (r === 'admin' || r === 'editor' || r === 'author' || r === 'reader') return r as EditorialRole;
  }
  // 2. Clerk org membership (org:admin => admin, org:editor => editor)
  const mem = sess.organizationMembershipList;
  if (Array.isArray(mem) && mem.length > 0) {
    const r = String(mem[0]?.role || '').toLowerCase();
    if (r.includes('admin')) return 'admin';
    if (r.includes('editor')) return 'editor';
  }
  // 3. Demo env override
  const demo = (process.env.NEXT_PUBLIC_DEMO_EDITOR_ROLE || '').toLowerCase();
  if (demo === 'admin' || demo === 'editor' || demo === 'author' || demo === 'reader') return demo as EditorialRole;
  return 'reader';
}

export function resolveUser(sess: SessionLike | null | undefined): {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: EditorialRole;
  department?: string;
  title?: string;
} | null {
  const role = resolveRole(sess);
  const userId = sess?.userId || sess?.user?.id;
  if (!userId) return null;
  const email = sess?.user?.email || sess?.emailAddresses?.[0]?.emailAddress || '';
  const name = sess?.user?.name || email?.split('@')[0] || 'Staff';
  const image = sess?.user?.image || undefined;
  return {
    id: String(userId),
    name: String(name),
    email: String(email),
    image: image ? String(image) : undefined,
    role,
    department: metaStr(sess, 'department'),
    title: metaStr(sess, 'title'),
  };
}

function metaStr(sess: any, key: string): string | undefined {
  const v = sess?.publicMetadata?.[key];
  return typeof v === 'string' ? v : undefined;
}
