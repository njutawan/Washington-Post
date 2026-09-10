/**
 * Middleware for the app.
 *
 * When NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is configured (in .env.local),
 * clerkMiddleware() wires up Clerk's session/auth on every request so
 * <SignInButton />, <UserButton />, auth() and the Clerk client components
 * work out of the box.
 *
 * When Clerk keys are *not* set (local dev without Clerk), middleware is a
 * no-op pass-through so the existing NextAuth demo sign-in continues to
 * work without throwing "Missing publishableKey" errors.
 */
import { NextResponse, type NextRequest } from 'next/server';

type ClerkMiddleware = (req: NextRequest) => Promise<Response>;
let clerkMw: ClerkMiddleware | null = null;

async function loadClerk(): Promise<ClerkMiddleware | null> {
  if (clerkMw !== undefined && clerkMw !== null) return clerkMw;
  try {
    const clerk = await import('@clerk/nextjs/server') as unknown as {
      clerkMiddleware: (fn: (auth: unknown, req: NextRequest) => Promise<Response>) => ClerkMiddleware;
      createRouteMatcher: (patterns: string[]) => (req: NextRequest) => boolean;
    };
    const isProtectedApi = clerk.createRouteMatcher([
      '/api/bookmarks(.*)',
      '/api/comments(.*)',
      '/api/newsletters(.*)',
      '/api/me(.*)',
    ]);
    clerkMw = clerk.clerkMiddleware(async (auth: unknown, req: NextRequest) => {
      if (isProtectedApi(req)) {
        try {
          const a = auth as { userId?: string | null };
          if (!a.userId) return NextResponse.next();
        } catch { return NextResponse.next(); }
      }
      return NextResponse.next();
    });
    return clerkMw;
  } catch {
    clerkMw = null;
    return null;
  }
}

// Kick off loading Clerk at module load so it's ready by first request.
let clerkPromise: Promise<ClerkMiddleware | null> | null = null;
if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
  clerkPromise = loadClerk().catch((): null => null);
}

export async function middleware(req: NextRequest) {
  if (clerkPromise) {
    try {
      const mw = await clerkPromise;
      if (mw) return await mw(req);
    } catch {
      return NextResponse.next();
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
