import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

/**
 * Guard for dev/test-only HTTP endpoints (e.g. /api/live/publish,
 * /api/push/send).
 *
 *  - In development the endpoint is open (demo convenience).
 *  - In production it returns 501 UNLESS a shared secret is configured via
 *    `envVar` AND the request sends it in the given header (compared in
 *    constant time). This keeps the demo working out of the box locally
 *    while making sure these helpers can't be abused in a production
 *    deployment by default.
 *
 * Returns an error response when the call must be rejected, or `null` when
 * the handler should continue.
 */
export function devOnlyGuard(
  req: Request,
  { header, envVar }: { header: string; envVar: string },
): NextResponse | null {
  if (process.env.NODE_ENV !== 'production') return null;

  const expected = process.env[envVar];
  if (!expected) {
    return NextResponse.json(
      { error: 'This dev/test endpoint is disabled in production.' },
      { status: 501 },
    );
  }

  const provided = req.headers.get(header);
  if (provided && safeEqual(provided, expected)) return null;

  return NextResponse.json(
    { error: 'This dev/test endpoint is disabled in production.' },
    { status: 501 },
  );
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
