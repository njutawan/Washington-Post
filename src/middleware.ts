import { NextResponse, type NextRequest } from 'next/server';
import { canonicalOrigin } from './lib/security-config';
/** Edge only: no DB/auth fallbacks. Authorization is enforced inside handlers/actions. */
export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    try {
      const origin = new URL(canonicalOrigin());
      if (
        req.headers.get('host')?.toLowerCase() !== origin.host.toLowerCase()
      ) {
        return NextResponse.json({ error: 'Invalid host' }, { status: 421 });
      }
    } catch {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 },
      );
    }
  }
  const res = NextResponse.next();
  // CWE-200: all personalized/API HTML responses are private, including secure/chunked cookies.
  if (
    req.nextUrl.pathname.startsWith('/api/') ||
    req.nextUrl.pathname.startsWith('/editorial') ||
    req.nextUrl.pathname === '/analytics' ||
    req.cookies
      .getAll()
      .some((c) =>
        /^(?:__Secure-)?authjs\.session-token(?:\.\d+)?$/.test(c.name),
      )
  ) {
    res.headers.set('Cache-Control', 'private, no-store');
  }
  return res;
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
