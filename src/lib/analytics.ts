/**
 * Privacy-first analytics store (in-memory, Plausible-compatible).
 *
 * In production this module is a thin wrapper around a Plausible script tag
 * (configured via NEXT_PUBLIC_PLAUSIBLE_DOMAIN). For the demo / self-hosted
 * mode it collects pageviews and custom events in-process and exposes a
 * dashboard endpoint (/api/analytics/stats) so the editorial metrics page
 * works without external services.
 *
 * - No cookies, no IPs, no PII
 * - Honors DNT at the edge (route.ts)
 * - Stores at most MAX_EVENTS events in memory, probabilistically trimming
 * - "Unique" sessions are approximated via a 24-hour client-generated sid
 */

export type AnalyticsEvent = {
  name: string;
  url: string;
  referrer?: string;
  screen?: number;
  ts: number;
  props?: Record<string, unknown>;
  duration?: number; // seconds
  scrollDepth?: number; // 0..1
  sessionId?: string;
};

const events: AnalyticsEvent[] = [];
const MAX_EVENTS = 10_000;
const CLEANUP_PROBABILITY = 0.05;

export function recordEvent(event: Omit<AnalyticsEvent, 'ts'> & { ts?: number }) {
  const full: AnalyticsEvent = { ts: event.ts || Date.now(), ...event };
  events.push(full);

  // Lazy cleanup: cap in-memory store
  if (events.length > MAX_EVENTS && Math.random() < CLEANUP_PROBABILITY) {
    events.splice(0, events.length - MAX_EVENTS);
  }
  return full;
}

export type StatsSummary = {
  windowMinutes: number;
  sinceISO: string;
  totals: { events: number; pageviews: number; uniques: number };
  topPages: Array<{
    path: string;
    views: number;
    uniques: number;
    avgDuration: number; // seconds
    avgScrollDepth: number; // 0..1
  }>;
  topReferrers: Array<{ source: string; views: number }>;
  eventsByName: Record<string, number>;
  funnel: { paywallSeen: number; paywallConvert: number; conversionRate: number };
  hourBuckets: Array<{ hour: string; views: number }>;
  counts: {
    shares: number;
    bookmarks: number;
    comments: number;
    newsletterSignups: number;
    pushSubscribes: number;
  };
};

export function getStats(sinceMinutes = 60 * 24): StatsSummary {
  const since = Date.now() - sinceMinutes * 60 * 1000;
  const recent = events.filter((e) => e.ts >= since);

  const pageEvents = new Map<string, {
    views: number;
    sessions: Set<string>;
    durationSum: number;
    durationN: number;
    scrollSum: number;
    scrollN: number;
  }>();
  const referrers = new Map<string, number>();
  const allSessions = new Set<string>();
  const eventsByName: Record<string, number> = {};

  let paywallSeen = 0;
  let paywallConvert = 0;
  let shares = 0;
  let bookmarks = 0;
  let comments = 0;
  let newsletterSignups = 0;
  let pushSubscribes = 0;
  let pageviewCount = 0;

  for (const e of recent) {
    eventsByName[e.name] = (eventsByName[e.name] || 0) + 1;
    if (e.sessionId) allSessions.add(e.sessionId);
    const path = normalizePath(e.url);

    if (e.name === 'pageview') {
      pageviewCount++;
      const stat = pageEvents.get(path) || freshPageStat();
      stat.views++;
      if (e.sessionId) stat.sessions.add(e.sessionId);
      if (e.referrer) referrers.set(normalizeReferrer(e.referrer), (referrers.get(normalizeReferrer(e.referrer)) || 0) + 1);
      if (typeof e.duration === 'number' && e.duration > 0) { stat.durationSum += e.duration; stat.durationN++; }
      if (typeof e.scrollDepth === 'number') { stat.scrollSum += e.scrollDepth; stat.scrollN++; }
      pageEvents.set(path, stat);
    }
    if (e.name === 'pageview_end') {
      const stat = pageEvents.get(path) || freshPageStat();
      if (typeof e.duration === 'number' && e.duration > 0) { stat.durationSum += e.duration; stat.durationN++; }
      if (typeof e.scrollDepth === 'number') { stat.scrollSum += e.scrollDepth; stat.scrollN++; }
      pageEvents.set(path, stat);
    }
    if (e.name === 'paywall_seen') paywallSeen++;
    if (e.name === 'paywall_convert') paywallConvert++;
    if (e.name === 'share') shares++;
    if (e.name === 'bookmark_toggle' && e.props?.added) bookmarks++;
    if (e.name === 'comment_post') comments++;
    if (e.name === 'newsletter_subscribe') newsletterSignups++;
    if (e.name === 'push_subscribe') pushSubscribes++;
  }

  const topPages = Array.from(pageEvents.entries())
    .map(([path, s]) => ({
      path,
      views: s.views,
      uniques: s.sessions.size,
      avgDuration: s.durationN ? s.durationSum / s.durationN : 0,
      avgScrollDepth: s.scrollN ? s.scrollSum / s.scrollN : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 20);

  const topReferrers = Array.from(referrers.entries())
    .map(([source, views]) => ({ source, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Hour buckets over the last 24 hours, labeled by hour-of-day (local server time)
  const hourBuckets: Array<{ hour: string; views: number }> = [];
  const now = new Date();
  const bucketIdx = new Map<number, number>();
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3_600_000);
    const label = String(d.getHours()).padStart(2, '0');
    bucketIdx.set(i, hourBuckets.length);
    hourBuckets.push({ hour: label, views: 0 });
  }
  for (const e of recent) {
    if (e.name !== 'pageview') continue;
    const hoursAgo = Math.floor((now.getTime() - e.ts) / 3_600_000);
    if (hoursAgo >= 0 && hoursAgo < 24) {
      const idx = bucketIdx.get(hoursAgo);
      if (typeof idx === 'number') hourBuckets[idx].views++;
    }
  }

  return {
    windowMinutes: sinceMinutes,
    sinceISO: new Date(since).toISOString(),
    totals: {
      events: recent.length,
      pageviews: pageviewCount,
      uniques: allSessions.size,
    },
    topPages,
    topReferrers,
    eventsByName,
    funnel: {
      paywallSeen,
      paywallConvert,
      conversionRate: paywallSeen ? paywallConvert / paywallSeen : 0,
    },
    hourBuckets,
    counts: { shares, bookmarks, comments, newsletterSignups, pushSubscribes },
  };
}

function freshPageStat() {
  return {
    views: 0,
    sessions: new Set<string>(),
    durationSum: 0,
    durationN: 0,
    scrollSum: 0,
    scrollN: 0,
  };
}

function normalizePath(url: string): string {
  try {
    const u = new URL(url, 'http://local');
    return u.pathname || '/';
  } catch {
    return url.split('?')[0].split('#')[0] || '/';
  }
}

function normalizeReferrer(referrer: string): string {
  try {
    const u = new URL(referrer);
    if (u.protocol === 'android-app:' || u.protocol === 'ios-app:') return referrer;
    const host = u.hostname.replace(/^www\./, '');
    return host || referrer.slice(0, 60);
  } catch {
    return referrer.slice(0, 60);
  }
}

/** Test-only helper to clear in-memory state between cases. */
export function _resetForTests() {
  events.length = 0;
}
