/**
 * Middleware for the app.
 *
 * When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is configured (in .env.local),
 * clerkMiddleware() wires up Clerk's session/auth on every request so
 * <SignInButton />, <UserButton />, auth() and the Clerk client components
 * work out of the box. It also enforces authentication on the protected
 * JSON API routes (401 for anonymous callers) — defense in depth on top of
 * the per-route `auth()` checks.
 *
 * When Clerk keys are *not* set (local dev without Clerk), middleware is a
 * no-op pass-through so the existing NextAuth demo sign-in continues to
 * work without throwing "Missing publishableKey" errors.
 */
import { NextResponse, type NextRequest } from 'next/server';

type ClerkAuthFn = () => Promise<{ userId?: string | null }>;
type ClerkMiddleware = (req: NextRequest) => Promise<Response>;

let clerkMw: ClerkMiddleware | null = null;
let clerkLoaded = false;

async function loadClerk(): Promise<ClerkMiddleware | null> {
  if (clerkLoaded) return clerkMw;
  try {
    const clerk = await import('@clerk/nextjs/server') as unknown as {
      clerkMiddleware: (fn: (auth: ClerkAuthFn, req: NextRequest) => Promise<Response>) => ClerkMiddleware;
      createRouteMatcher: (patterns: string[]) => (req: NextRequest) => boolean;
    };
    const isProtectedApi = clerk.createRouteMatcher([
      '/api/bookmarks(.*)',
      '/api/comments(.*)',
      '/api/newsletters(.*)',
      '/api/me(.*)',
      '/api/editorial(.*)',
    ]);
    clerkMw = clerk.clerkMiddleware(async (auth: ClerkAuthFn, req: NextRequest) => {
      if (isProtectedApi(req)) {
        try {
          const session = await auth();
          if (!session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }
        } catch {
          // Auth check failed (e.g. malformed token) — treat as anonymous.
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
      return NextResponse.next();
    });
  } catch {
    clerkMw = null;
  }
  clerkLoaded = true; // cache success AND failure so we don't re-import per request
  return clerkMw;
}

// Kick off loading Clerk at module load so it's ready by first request.
let clerkPromise: Promise<ClerkMiddleware | null> | null = null;
if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  clerkPromise = loadClerk().catch((): null => null);
}

/**
 * Signed-in pages embed the session (name, email, bookmarks) in the RSC
 * flight payload inline in the HTML. Never let proxies or the service
 * worker cache personalized HTML (CWE-200 — shared-device exposure).
 * The session cookies are HttpOnly, so their mere presence is a reliable
 * "logged in" signal without validating a JWT here.
 */
function markNoStoreIfSignedIn(req: NextRequest, res: Response): Response {
  if (
    res instanceof NextResponse &&
    (req.cookies.has('authjs.session-token') || req.cookies.has('__session'))
  ) {
    res.headers.set('Cache-Control', 'private, no-store');
  }
  return res;
}

export async function middleware(req: NextRequest) {
  if (clerkPromise) {
    try {
      const mw = await clerkPromise;
      if (mw) {
        return markNoStoreIfSignedIn(req, await mw(req));
      }
    } catch {
      // Never take the site down because of middleware trouble.
      return markNoStoreIfSignedIn(req, NextResponse.next());
    }
  }
  return markNoStoreIfSignedIn(req, NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
