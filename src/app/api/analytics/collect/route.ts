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
 * Respects DNT (Do Not Track) — returns 204 without recording if set.
 *
 * The endpoint is public and unauthenticated, so every field is length-capped
 * / type-checked to keep the in-memory store bounded and free of garbage.
 */

const NAME_MAX = 100;
const SID_MAX = 64;
const REFERRER_MAX = 2048;
const URL_MAX = 2048;
const PROPS_MAX_KEYS = 12;
const PROPS_VALUE_MAX = 100;
const DURATION_MAX_MS = 24 * 60 * 60 * 1000;

/** Shallow-sanitize props: plain object, ≤12 keys, scalar values only. */
function cleanProps(raw: unknown): Record<string, string | number | boolean> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (Object.keys(out).length >= PROPS_MAX_KEYS) break;
    if (typeof k === 'string' && k.length <= 50) {
      if (typeof v === 'string' && v.length <= PROPS_VALUE_MAX) out[k] = v;
      else if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
      else if (typeof v === 'boolean') out[k] = v;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

export async function POST(req: NextRequest) {
  const dnt = req.headers.get('dnt');
  if (dnt === '1') {
    return new NextResponse(null, { status: 204 });
  }

  let body: any = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const name = (body.n || body.name || 'pageview');
  const url = body.u || body.url;
  if (typeof name !== 'string' || name.length > NAME_MAX) {
    return NextResponse.json({ error: 'invalid event name' }, { status: 400 });
  }
  if (typeof url !== 'string' || !url || url.length > URL_MAX) {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

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

  const referrer = body.r || body.referrer;
  const sessionId = body.sid;
  const screen = body.w;
  const duration = body.d;
  const scrollDepth = body.sd;

  recordEvent({
    name,
    url,
    referrer: typeof referrer === 'string' ? referrer.slice(0, REFERRER_MAX) : undefined,
    screen: typeof screen === 'number' && Number.isFinite(screen) && screen >= 0 && screen <= 100_000
      ? Math.round(screen)
      : undefined,
    sessionId: typeof sessionId === 'string' && sessionId.length <= SID_MAX ? sessionId : undefined,
    props: cleanProps(body.props),
    duration: typeof duration === 'number' && Number.isFinite(duration) && duration >= 0 && duration <= DURATION_MAX_MS
      ? duration
      : undefined,
    scrollDepth: typeof scrollDepth === 'number' && Number.isFinite(scrollDepth)
      ? Math.max(0, Math.min(1, scrollDepth))
      : undefined,
  });

  return NextResponse.json({ ok: true });
}
