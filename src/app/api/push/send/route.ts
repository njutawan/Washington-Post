import { NextRequest, NextResponse } from 'next/server';
import { sendPush, type PushPayload } from '@/lib/push';
import { devOnlyGuard } from '@/lib/devGuard';
import { csrfBlock } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

/**
 * Dev/test endpoint to broadcast a push notification to all subscribed clients.
 * POST /api/push/send { title, body, url?, topic?, tag? }
 *
 * Security: disabled in production unless PUSH_SEND_TOKEN is set and sent as
 * the `x-push-send-token` header (see devOnlyGuard). Inputs are capped and
 * validated — url/image must be same-origin paths, topic must be a known one.
 * In a real deployment this would be an admin workflow (CMS trigger), not a
 * public HTTP endpoint at all.
 */

const TITLE_MAX = 150;
const BODY_MAX = 400;
const TAG_MAX = 50;
const URL_MAX = 500;
const TOPICS = new Set(['breaking', 'politics', 'world', 'business', 'sports', 'entertainment', 'tech']);

/** Accept only same-origin relative paths (e.g. `/article/foo`) — no
 *  absolute URLs, no `javascript:`/`data:` schemes, no open redirects. */
function cleanSameOriginPath(value: unknown, maxLen: number): string | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (!v.startsWith('/') || v.startsWith('//') || v.length > maxLen) return undefined;
  return v;
}

export async function POST(req: NextRequest) {
  const blocked = csrfBlock(req);
  if (blocked) return blocked;
  const guarded = devOnlyGuard(req, {
    header: 'x-push-send-token',
    envVar: 'PUSH_SEND_TOKEN',
  });
  if (guarded) return guarded;

  let body: Partial<PushPayload> & { title?: string; body?: string } = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  if (!title || !text) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 });
  }
  if (title.length > TITLE_MAX || text.length > BODY_MAX) {
    return NextResponse.json(
      { error: `title ≤ ${TITLE_MAX}, body ≤ ${BODY_MAX} chars` },
      { status: 400 },
    );
  }

  const url = cleanSameOriginPath(body.url, URL_MAX) || '/';
  const image = body.image ? cleanSameOriginPath(body.image, URL_MAX) : undefined;
  if (body.image && !image) {
    return NextResponse.json({ error: 'image must be a same-origin path' }, { status: 400 });
  }
  const tag = body.tag ? String(body.tag).slice(0, TAG_MAX) : undefined;
  const topic = body.topic ? String(body.topic) : 'breaking';
  if (!TOPICS.has(topic)) {
    return NextResponse.json({ error: `unknown topic (allowed: ${[...TOPICS].join(', ')})` }, { status: 400 });
  }

  const result = await sendPush({
    title,
    body: text,
    url,
    tag,
    topic,
    image,
    requireInteraction: !!body.requireInteraction,
  });
  return NextResponse.json({ ok: true, ...result });
}
