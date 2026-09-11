import { randomBytes } from 'crypto';
import { headers } from 'next/headers';
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

// ---------------------------------------------------------------------------
// Brute-force protection (CWE-307) for the credentials provider.
//
// Without lockout, an attacker who knows a valid email can hammer
// /api/auth/callback/credentials. We track attempts per (client IP, email)
// in memory and lock after RATE_MAX_ATTEMPTS within RATE_WINDOW_MS.
// Multi-instance deployments should back this with Redis; the in-memory
// version still protects a single-instance deploy.
// ---------------------------------------------------------------------------
const RATE_MAX_ATTEMPTS = 10;
const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const rateBuckets = new Map<string, { count: number; firstAt: number; lockedUntil: number }>();

async function getClientIp(): Promise<string> {
  try {
    const h = await headers();
    return (
      h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
    );
  } catch {
    return 'unknown';
  }
}

/** Returns false when the (ip, email) pair is over the attempt budget. */
function rateLimitCheck(ip: string, email: string): boolean {
  const now = Date.now();
  const key = `${ip}::${email}`;
  let b = rateBuckets.get(key);
  if (!b) {
    b = { count: 0, firstAt: now, lockedUntil: 0 };
    rateBuckets.set(key, b);
  }
  if (now - b.firstAt > RATE_WINDOW_MS) {
    b.count = 0;
    b.firstAt = now;
    b.lockedUntil = 0;
  }
  if (b.lockedUntil > now) return false; // still locked
  b.count += 1;
  if (b.count >= RATE_MAX_ATTEMPTS) {
    b.lockedUntil = now + RATE_WINDOW_MS;
    return false;
  }
  return true;
}

function rateLimitReset(ip: string, email: string) {
  rateBuckets.delete(`${ip}::${email}`);
}

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
      const ip = await getClientIp();

      if (mode === 'signup') {
        const existing = await findUserByEmail(email);
        if (existing) throw new Error('An account with that email already exists.');
        if (password.length < 4) throw new Error('Password must be at least 4 characters.');
        const user = await createUserWithEmail({ email, password, name });
        return { id: user.id, email: user.email, name: user.name, image: user.image || null };
      }

      // Brute-force guard: gate sign-in attempts (not sign-ups).
      if (!rateLimitCheck(ip, email)) {
        throw new Error('Too many sign-in attempts. Please try again in 15 minutes.');
      }
      const user = await verifyPassword(email, password);
      if (!user) throw new Error('Invalid email or password.');
      rateLimitReset(ip, email);
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
// NEXT_PUBLIC_ENABLE_DEMO=1.
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
  // Suppress the warning during `next build` (phase-production-build): at
  // build time no real sessions are issued, and build workers would log it
  // repeatedly. The warning still fires at request-serving runtime, which is
  // where a missing secret actually matters.
  if (process.env.NEXT_PHASE !== 'phase-production-build') {
    // eslint-disable-next-line no-console
    console.warn(
      '[auth] NEXTAUTH_SECRET is not set. Using a random per-process secret — ' +
        'sessions will not survive restarts and multi-instance deploys will ' +
        'desync. Set NEXTAUTH_SECRET in production.',
    );
  }
  return randomBytes(32).toString('hex');
})();

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  // CWE-613: the framework default is 30 days idle — too long for a news
  // site. 7 days balances convenience against session-hijack window.
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
  secret: nextAuthSecret,
  // trustHost is required when the app sits behind a proxy (Vercel, nginx).
  // For belt-and-braces, also accept an explicit NEXTAUTH_URL in production
  // so the base origin can be pinned even if headers are manipulated.
  trustHost: true,
  ...(process.env.NEXTAUTH_URL ? { baseURL: process.env.NEXTAUTH_URL } : {}),
  cookies: {
    sessionToken: {
      options: {
        sameSite: 'lax', // CSRF mitigation for cookie-based state (CWE-352)
        secure: process.env.NODE_ENV === 'production', // no session cookie over plain HTTP
      },
    },
  },
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
