import { NextRequest, NextResponse } from 'next/server';
import { addSubscription, removeSubscription } from '@/lib/push';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const sub = body.subscription;
  if (!sub || !sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: 'invalid push subscription' }, { status: 400 });
  }
  const ok = addSubscription(sub, {
    topics: body.topics,
    userAgent: req.headers.get('user-agent') || undefined,
  });
  return NextResponse.json({ ok, count: ok ? 1 : 0 });
}

export async function DELETE(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const endpoint = body?.endpoint || body?.subscription?.endpoint;
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 });
  removeSubscription(endpoint);
  return NextResponse.json({ ok: true });
}
