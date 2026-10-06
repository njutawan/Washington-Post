import { NextRequest, NextResponse } from 'next/server';
import { addSubscription, removeSubscription } from '@/lib/push';
import { csrfBlock } from '@/lib/csrf';

export const dynamic = 'force-dynamic';

// The subscribe endpoint is public (any visitor's browser calls it), so all
// fields are length-capped to keep the in-memory store bounded.
const ENDPOINT_MAX = 2048;
const KEY_MAX = 256;
const TOPIC_MAX = 50;
const TOPICS_MAX_LEN = 10;
const UA_MAX = 256;

function cleanTopics(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const topics = raw
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.slice(0, TOPIC_MAX))
    .filter(Boolean)
    .slice(0, TOPICS_MAX_LEN);
  return topics.length ? topics : undefined;
}

export async function POST(req: NextRequest) {
  const blocked = csrfBlock(req);
  if (blocked) return blocked;
  let body: any = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const sub = body.subscription;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (
    typeof endpoint !== 'string' || !endpoint || endpoint.length > ENDPOINT_MAX ||
    typeof p256dh !== 'string' || !p256dh || p256dh.length > KEY_MAX ||
    typeof auth !== 'string' || !auth || auth.length > KEY_MAX
  ) {
    return NextResponse.json({ error: 'invalid push subscription' }, { status: 400 });
  }
  const ok = addSubscription(
    { endpoint, keys: { p256dh, auth } } as any,
    {
      topics: cleanTopics(body.topics),
      userAgent: (req.headers.get('user-agent') || '').slice(0, UA_MAX) || undefined,
    },
  );
  return NextResponse.json({ ok, count: ok ? 1 : 0 });
}

export async function DELETE(req: NextRequest) {
  const blocked = csrfBlock(req);
  if (blocked) return blocked;
  let body: any = {};
  try { body = await req.json(); } catch {}
  const endpoint = body?.endpoint || body?.subscription?.endpoint;
  if (typeof endpoint !== 'string' || !endpoint) {
    return NextResponse.json({ error: 'endpoint required' }, { status: 400 });
  }
  removeSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
