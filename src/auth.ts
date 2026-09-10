import { randomBytes } from 'crypto';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import Apple from 'next-auth/providers/apple';
import {
  findUserByEmail,
  createUserWithEmail,
  verifyPassword,
  createOAuthUser,
  getBookmarks,
} from '@/lib/db';

// Note: In this demo OAuth providers are enabled but fall back safely if
// credentials aren't configured in env. Real OAuth client IDs/secrets can be
// added to .env.local to activate the providers.
const providers: any[] = [];

providers.push(
  Credentials({
    name: 'Email',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
      name: { label: 'Name (for sign up)', type: 'text' },
      mode: { label: 'Mode', type: 'text' }, // 'signin' | 'signup'
    },
    async authorize(creds) {
      if (!creds?.email) return null;
      const email = String(creds.email).trim().toLowerCase();
      const password = String(creds.password || '');
      const mode = String(creds.mode || 'signin');
      const name = creds.name ? String(creds.name) : undefined;

      if (mode === 'signup') {
        const existing = await findUserByEmail(email);
        if (existing) throw new Error('An account with that email already exists.');
        if (password.length < 4) throw new Error('Password must be at least 4 characters.');
        const user = await createUserWithEmail({ email, password, name });
        return { id: user.id, email: user.email, name: user.name, image: user.image || null };
      }

      const user = await verifyPassword(email, password);
      if (!user) throw new Error('Invalid email or password.');
      return { id: user.id, email: user.email, name: user.name, image: user.image || null };
    },
  }),
);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
    }),
  );
}

// If no OAuth providers are configured, expose a demo "one-click" provider so
// reviewers can test the account experience without needing env vars.
// Security: this provider signs in a fixed account with NO credential
// check, so it is disabled in production unless explicitly re-enabled with
// NEXTAUTH_ENABLE_DEMO=1.
// NEXT_PUBLIC_ prefix so the /signin page can mirror this exact condition
// when deciding whether to render the demo button (client + server agree).
const demoProviderEnabled =
  process.env.NEXT_PUBLIC_ENABLE_DEMO === '1' || process.env.NODE_ENV !== 'production';

if (!process.env.GOOGLE_CLIENT_ID && demoProviderEnabled) {
  // Demo provider: sign in as demo@wapo-clone.example.com instantly.
  providers.push({
    id: 'demo',
    name: 'Demo (1-click)',
    type: 'credentials' as const,
    credentials: {},
    async authorize() {
      let user = await findUserByEmail('demo@wapo-clone.example.com');
      if (!user) {
        user = await createUserWithEmail({
          email: 'demo@wapo-clone.example.com',
          password: 'demo1234',
          name: 'Demo Reader',
        });
      }
      return { id: user.id, email: user.email, name: user.name, image: null };
    },
  } as any);
}

// Security: never fall back to a public/known constant in production — that
// would let anyone forge session JWTs. If NEXTAUTH_SECRET is missing at
// production runtime we generate a random per-process secret instead: the
// site stays up and no public secret is ever used, but sessions won't survive
// restarts (and with multiple instances each instance has its own). Set
// NEXTAUTH_SECRET in real deployments (see .env.example).
const nextAuthSecret = (() => {
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;
  if (process.env.NODE_ENV !== 'production') {
    return 'wapo-demo-secret-dev-only';
  }
  // eslint-disable-next-line no-console
  console.warn(
    '[auth] NEXTAUTH_SECRET is not set. Using a random per-process secret — ' +
      'sessions will not survive restarts and multi-instance deploys will ' +
      'desync. Set NEXTAUTH_SECRET in production.',
  );
  return randomBytes(32).toString('hex');
})();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  session: { strategy: 'jwt' },
  secret: nextAuthSecret,
  trustHost: true,
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider && user) {
        // OAuth sign-in — upsert user in our DB
        if (account.provider !== 'credentials' && account.provider !== 'demo') {
          const dbUser = await createOAuthUser({
            email: user.email || '',
            name: user.name || undefined,
            image: user.image || undefined,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          });
          token.uid = dbUser.id;
        } else {
          token.uid = (user as any).id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as any).id = token.uid;
        // Attach bookmarks to session so client can render immediately
        try {
          (session as any).bookmarks = await getBookmarks(token.uid as string);
        } catch {
          (session as any).bookmarks = [];
        }
      }
      return session;
    },
    async signIn({ user, account }) {
      return true;
    },
  },
});
