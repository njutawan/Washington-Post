import { NextRequest, NextResponse } from 'next/server';
import { sendPush, type PushPayload } from '@/lib/push';

export const dynamic = 'force-dynamic';

/**
 * Dev/test endpoint to broadcast a push notification to all subscribed clients.
 * POST /api/push/send { title, body, url?, topic?, tag? }
 *
 * In production this would be protected by an admin auth check and triggered
 * by a CMS/editor workflow.
 */
export async function POST(req: NextRequest) {
  let body: Partial<PushPayload> & { title?: string; body?: string } = {};
  try { body = await req.json(); } catch {}
  if (!body.title || !body.body) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 });
  }
  const result = await sendPush({
    title: String(body.title),
    body: String(body.body),
    url: body.url || '/',
    tag: body.tag,
    topic: body.topic || 'breaking',
    image: body.image,
    requireInteraction: body.requireInteraction,
  });
  return NextResponse.json({ ok: true, ...result });
}
