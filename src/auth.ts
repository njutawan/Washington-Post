import { randomBytes } from 'crypto';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import {
  createUserWithEmail,
  verifyPassword,
  getBookmarks,
  getStaffIdentity,
} from '@/lib/db';
import { signupSchema } from '@/lib/security-input';
import { consumeLimit, clientKey, privateKey } from '@/lib/rate-limit';
import { tenantId, validateRuntimeConfig } from '@/lib/security-config';

// No Clerk/OAuth fallback, email-based role assignment, or client-supplied roles.
// Runtime instrumentation validates production configuration before serving requests.
// CWE-798: no public/hard-coded signing secret; production requires stable env.
const secret =
  process.env.NEXTAUTH_SECRET ||
  (process.env.NODE_ENV !== 'production'
    ? randomBytes(32).toString('hex')
    : undefined);
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Email',
      credentials: { email: {}, password: {}, name: {}, mode: {} },
      async authorize(creds, req) {
        validateRuntimeConfig();
        // CWE-307: shared IP/account budgets cover BOTH sign-in and sign-up.
        const ip = clientKey(req);
        const ipBudget = await consumeLimit(
          'credentials:' + ip,
          30,
          15 * 60000,
        );
        if (!ipBudget.allowed) return null;
        const email =
          typeof creds.email === 'string'
            ? creds.email.trim().toLowerCase()
            : '';
        const password =
          typeof creds.password === 'string' ? creds.password : '';
        if (!email || email.length > 254 || password.length > 128) return null;
        const accountBudget = await consumeLimit(
          'credentials-account:' + privateKey(email),
          10,
          15 * 60000,
        );
        if (!accountBudget.allowed) return null;
        if (creds.mode === 'signup') {
          // Public registration is opt-in. No admin/editor roles are assigned here.
          if (
            process.env.NODE_ENV === 'production' &&
            process.env.ALLOW_SIGNUP !== 'true'
          )
            return null;
          const result = signupSchema.safeParse({
            email,
            password,
            name: creds.name || undefined,
          });
          if (!result.success) return null;
          const user = await createUserWithEmail(result.data).catch(() => null);
          return user
            ? { id: user.id, email: user.email, name: user.name }
            : null;
        }
        if (creds.mode && creds.mode !== 'signin') return null;
        const user = await verifyPassword(email, password);
        return user
          ? {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            }
          : null;
      },
    }),
  ],
  // CWE-613: seven-day maximum session lifetime, not the framework's 30 days.
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  secret,
  trustHost: true, // request Host is pinned by middleware and canonical NEXTAUTH_URL
  pages: { signIn: '/signin' },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.uid = user.id;
        token.tenantId = tenantId();
      }
      if (token.tenantId !== tenantId()) return null;
      return token;
    },
    async session({ session, token }) {
      // Fresh DB check: deleted/disabled accounts lose access immediately. Roles
      // are NEVER trusted from JWT/metadata: every CMS operation re-reads them.
      const user =
        token.uid && token.tenantId === tenantId()
          ? await getStaffIdentity(token.uid)
          : null;
      session.user.id = user?.id || '';
      session.user.tenantId = user ? tenantId() : '';
      session.bookmarks = user ? await getBookmarks(user.id) : [];
      return session;
    },
  },
  logger: {
    error() {
      console.warn('[auth] authentication failed');
    },
    warn() {
      console.warn('[auth] configuration warning');
    },
    debug() {
      /* no credential/provider payload logging */
    },
  },
});
