/** The deployment is a single NextAuth newsroom; tenant identity is server-owned. */
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
export function atLeast(role: EditorialRole, required: EditorialRole) {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[required];
}
export type Actor = {
  id: string;
  name: string;
  email: string;
  role: EditorialRole;
  tenantId: string;
};
