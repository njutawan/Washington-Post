import { NextRequest, NextResponse } from 'next/server';
import { recordEvent } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

/**
 * Plausible-compatible event collector.
 *
 * Accepts POST body { n: eventName, u: url, r: referrer, w: screenWidth,
 * props: { ... }, d: durationMs, sd: scrollDepth }. This mirrors the
 * Plausible /api/event endpoint so the same client script can send to either.
 *
 * Respects DNT (Do Not Track) — returns 202 without recording if set.
 */
export async function POST(req: NextRequest) {
  const dnt = req.headers.get('dnt');
  if (dnt === '1') {
    return new NextResponse(null, { status: 204 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const name = body.n || body.name || 'pageview';
  const url = body.u || body.url;
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 });

  // Only allow relative URLs to prevent SSRF / pollution from external sites
  let parsed;
  try {
    parsed = new URL(url, 'http://local');
    if (parsed.hostname && parsed.hostname !== 'local') {
      // Absolute URL — accept if it's our own origin
      const host = req.headers.get('host');
      if (parsed.host !== host) {
        return NextResponse.json({ error: 'origin mismatch' }, { status: 400 });
      }
    }
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  recordEvent({
    name: String(name),
    url,
    referrer: body.r || body.referrer,
    screen: typeof body.w === 'number' ? body.w : undefined,
    sessionId: typeof body.sid === 'string' ? body.sid : undefined,
    props: body.props,
    duration: typeof body.d === 'number' ? body.d : undefined,
    scrollDepth: typeof body.sd === 'number' ? Math.max(0, Math.min(1, body.sd)) : undefined,
  });

  return NextResponse.json({ ok: true });
}
