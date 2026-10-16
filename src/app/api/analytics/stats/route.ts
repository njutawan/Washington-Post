import { NextResponse } from 'next/server';
import { getStats } from '@/lib/analytics';
import { requireActor } from '@/lib/editorialAuth.server';
import { withApi } from '@/lib/http-security';
export const dynamic = 'force-dynamic';
export const GET = withApi({ name: 'stats', max: 60 }, async (req: Request) => {
  await requireActor('editor');
  const raw = new URL(req.url).searchParams.get('since');
  const since = Math.min(10080, Math.max(5, Number(raw) || 1440));
  return NextResponse.json(await getStats(since));
});
