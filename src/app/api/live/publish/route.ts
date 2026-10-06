/**
 * Dev/test helper to manually push an update into the live blog so we can
 * see the "new updates" badge animate without waiting for the simulator.
 * POST /api/live/publish { slug?, title, body, live?, byline? }
 *
 * Security: dev-only endpoint — disabled in production unless
 * LIVE_PUBLISH_TOKEN is set and sent as the `x-live-publish-token` header.
 * Input is validated and length-capped; only known live-blog slugs are
 * accepted (unknown slugs must not create store entries or timers).
 */
import { NextRequest, NextResponse } from 'next/server';
import { addLiveUpdate, isValidLiveSlug } from '@/lib/liveData';
import { devOnlyGuard } from '@/lib/devGuard';
import { csrfBlock } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

const TITLE_MAX = 200;
const BODY_MAX = 2000;
const BYLINE_MAX = 100;

export async function POST(req: NextRequest) {
  const blocked = csrfBlock(req);
  if (blocked) return blocked;
  const guarded = devOnlyGuard(req, {
    header: 'x-live-publish-token',
    envVar: 'LIVE_PUBLISH_TOKEN',
  });
  if (guarded) return guarded;

  let body: any = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const slug = typeof body.slug === 'string' ? body.slug : 'shutdown-deal';
  if (!isValidLiveSlug(slug)) {
    return NextResponse.json({ error: 'unknown live blog' }, { status: 404 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  const byline = typeof body.byline === 'string' ? body.byline.trim() : undefined;
  if (!title || !text) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 });
  }
  if (title.length > TITLE_MAX || text.length > BODY_MAX || (byline && byline.length > BYLINE_MAX)) {
    return NextResponse.json(
      { error: `title ≤ ${TITLE_MAX}, body ≤ ${BODY_MAX}, byline ≤ ${BYLINE_MAX} chars` },
      { status: 400 },
    );
  }

  const u = addLiveUpdate(slug, {
    title,
    body: text,
    live: body.live !== false,
    byline,
  });
  return NextResponse.json({ ok: true, update: u });
}
