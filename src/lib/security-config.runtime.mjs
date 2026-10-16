/** Single auth realm / newsroom per deployment. Never derive it from request headers. */
export function tenantId() {
  const id =
    process.env.APP_TENANT_ID ||
    (process.env.NODE_ENV !== 'production' ? 'local' : '');
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(id))
    throw new Error('APP_TENANT_ID is required');
  return id;
}
export function canonicalOrigin() {
  const raw =
    process.env.NEXTAUTH_URL ||
    (process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : '');
  const url = new URL(raw);
  if (
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    !['https:', 'http:'].includes(url.protocol) ||
    (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')
  ) {
    throw new Error('NEXTAUTH_URL must be a canonical HTTPS origin');
  }
  return url.origin;
}
export function validateRuntimeConfig() {
  if (process.env.NODE_ENV !== 'production') return;
  canonicalOrigin();
  tenantId();
  if (process.env.AUTH_URL && process.env.AUTH_URL !== process.env.NEXTAUTH_URL)
    throw new Error('Conflicting auth origins');
  const secret = process.env.NEXTAUTH_SECRET || '';
  if (
    secret.length < 32 ||
    new Set(secret).size < 8 ||
    /^(change|example|test|demo|x{8})/i.test(secret)
  )
    throw new Error('Strong NEXTAUTH_SECRET required');
  if (!process.env.DATABASE_URL)
    throw new Error(
      'DATABASE_URL required; local JSON storage is not allowed in production',
    );
  if (
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.CLERK_SECRET_KEY
  ) {
    throw new Error(
      'Clerk is not supported: this deployment uses NextAuth only',
    );
  }
}
