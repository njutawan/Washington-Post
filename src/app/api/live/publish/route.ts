/**
 * Dev/test helper to manually push an update into the live blog so we can
 * see the "new updates" badge animate without waiting for the simulator.
 * POST /api/live/publish { slug, title, body, live? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { addLiveUpdate } from '@/lib/liveData';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: any = {};
  try { body = await req.json(); } catch {}
  const slug = body.slug || 'shutdown-deal';
  if (!body.title || !body.body) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 });
  }
  const u = addLiveUpdate(slug, {
    title: String(body.title),
    body: String(body.body),
    live: body.live !== false,
  });
  return NextResponse.json({ ok: true, update: u });
}
