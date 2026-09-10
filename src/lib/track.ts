'use client';

/**
 * Thin client-side tracker. Sends events to the built-in /api/analytics/collect
 * endpoint (Plausible-compatible shape). If NEXT_PUBLIC_PLAUSIBLE_DOMAIN is
 * configured, also forwards events to Plausible's global.plausible queue.
 *
 * Usage:
 *   track('share', { props: { slug, method: 'native' } })
 *   trackPageview()  // called automatically by <Analytics />
 *
 * Privacy:
 *   - No cookies, no user identifiers persisted beyond the current tab session
 *   - Respects navigator.doNotTrack
 *   - Session id is an in-memory random id + 24h localStorage fallback for
 *     "unique" counting only; never joined with personal data.
 */

type EventProps = Record<string, string | number | boolean>;

const COLLECT_ENDPOINT = '/api/analytics/collect';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const KEY = 'wapo:analytics:sid';
    let sid = window.sessionStorage.getItem(KEY);
    if (!sid) {
      sid = (window.localStorage.getItem(KEY) as string | null) || '';
      if (!sid || isOldSid(sid)) {
        sid = 's_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        window.localStorage.setItem(KEY, sid);
      }
      window.sessionStorage.setItem(KEY, sid);
    }
    return sid;
  } catch {
    return '';
  }
}

function isOldSid(sid: string) {
  try {
    const ts = parseInt(sid.split('_').pop() || '0', 36);
    return Date.now() - ts > 1000 * 60 * 60 * 24; // rotate after 24h
  } catch {
    return true;
  }
}

function dntEnabled() {
  if (typeof window === 'undefined') return false;
  return (navigator as any).doNotTrack === '1' || (window as any).doNotTrack === '1';
}

function sendToLocal(name: string, payload: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (dntEnabled()) return;
  const body = JSON.stringify({ n: name, sid: getSessionId(), ...payload });
  const sentBeacon = (() => {
    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        return navigator.sendBeacon(COLLECT_ENDPOINT, blob);
      }
    } catch {
      /* fall through */
    }
    return false;
  })();
  if (sentBeacon) return;
  fetch(COLLECT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
    credentials: 'omit',
  }).catch(() => {});
}

export function track(name: string, opts: {
  props?: EventProps;
  duration?: number;
  scrollDepth?: number;
} = {}) {
  if (typeof window === 'undefined') return;
  if (dntEnabled()) return;
  const payload: Record<string, unknown> = {
    u: window.location.href,
    r: document.referrer || undefined,
    w: window.innerWidth,
    props: opts.props,
    d: opts.duration,
    sd: opts.scrollDepth,
  };
  sendToLocal(name, payload);
  // Forward to Plausible if loaded
  const pl = (window as any).plausible;
  if (typeof pl === 'function') {
    try { pl(name, { props: opts.props }); } catch { /* ignore */ }
  }
}

let lastPageviewUrl = '';
let pageviewStart = 0;
let maxScroll = 0;
let scrollListener: (() => void) | null = null;
let scrollTicking = false;

export function trackPageview() {
  if (typeof window === 'undefined') return;
  if (dntEnabled()) return;
  // Send previous page's end event first
  if (pageviewStart && window.location.href !== lastPageviewUrl) {
    const duration = Math.round((Date.now() - pageviewStart) / 1000);
    sendToLocal('pageview_end', {
      u: lastPageviewUrl,
      d: duration,
      sd: maxScroll,
    });
    if (scrollListener) window.removeEventListener('scroll', scrollListener);
  }
  lastPageviewUrl = window.location.href;
  pageviewStart = Date.now();
  maxScroll = 0;
  scrollTicking = false;
  // rAF-throttled scroll listener
  scrollListener = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(() => {
      const doc = document.documentElement;
      const scrolled = window.scrollY;
      const total = doc.scrollHeight - window.innerHeight;
      if (total > 0) {
        const depth = Math.max(0, Math.min(1, scrolled / total));
        if (depth > maxScroll) maxScroll = depth;
      }
      scrollTicking = false;
    });
  };
  window.addEventListener('scroll', scrollListener, { passive: true } as AddEventListenerOptions);
  track('pageview');
}

/** Send a pageview_end event when the user navigates away or hides the tab. */
export function flushPageview() {
  if (!pageviewStart) return;
  const duration = Math.round((Date.now() - pageviewStart) / 1000);
  sendToLocal('pageview_end', {
    u: lastPageviewUrl || window.location.href,
    d: duration,
    sd: maxScroll,
  });
  pageviewStart = 0;
  if (scrollListener) {
    window.removeEventListener('scroll', scrollListener);
    scrollListener = null;
  }
}
