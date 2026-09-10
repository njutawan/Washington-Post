import { NextResponse } from 'next/server';
import { getStats } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

/**
 * Editorial analytics dashboard data endpoint.
 * Returns pageview totals, top pages, referrers, conversion funnel, etc.
 * Accepts ?since=1440 (minutes, default 24h).
 *
 * Demo: unauthenticated. In production this should be behind auth.
 */
export function GET(req: Request) {
  const url = new URL(req.url);
  const since = Math.min(60 * 24 * 7, Math.max(5, Number(url.searchParams.get('since')) || 60 * 24));
  return NextResponse.json(getStats(since));
}
