/**
 * Vitest unit tests for the privacy-friendly analytics aggregator
 * (src/lib/analytics.ts).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { recordEvent, getStats, _resetForTests } from '../../src/lib/analytics';

beforeEach(() => {
  _resetForTests();
});

function ev(overrides: Partial<Parameters<typeof recordEvent>[0]> = {}) {
  return {
    name: 'pageview',
    url: 'https://wapo.test/',
    sessionId: 'sess-1',
    ...overrides,
  };
}

describe('analytics aggregator', () => {
  it('counts pageviews and unique sessions', () => {
    recordEvent(ev({ url: 'https://wapo.test/politics/story-1', referrer: 'https://google.com/', sessionId: 'a' }));
    recordEvent(ev({ url: 'https://wapo.test/politics/story-1', referrer: 'https://google.com/', sessionId: 'b' }));
    recordEvent(ev({ url: 'https://wapo.test/politics/story-1', referrer: 'https://google.com/', sessionId: 'a' }));
    const stats = getStats(60);
    expect(stats.totals.pageviews).toBe(3);
    expect(stats.totals.uniques).toBe(2);
    expect(stats.topPages[0].path).toBe('/politics/story-1');
    expect(stats.topPages[0].views).toBe(3);
    expect(stats.topPages[0].uniques).toBe(2);
  });

  it('builds paywall funnel with conversion rate', () => {
    for (let i = 0; i < 10; i++) {
      recordEvent(ev({ name: 'paywall_seen', url: 'https://wapo.test/article/premium', sessionId: `s-${i}`, props: { slug: 'premium', blocked: true } }));
    }
    for (let i = 0; i < 3; i++) {
      recordEvent(ev({ name: 'paywall_convert', url: 'https://wapo.test/article/premium', sessionId: `s-${i}`, props: { slug: 'premium', action: 'subscribe_cta' } }));
    }
    const stats = getStats(60);
    expect(stats.funnel.paywallSeen).toBe(10);
    expect(stats.funnel.paywallConvert).toBe(3);
    expect(stats.funnel.conversionRate).toBeCloseTo(0.3, 2);
  });

  it('buckets engagement events (shares/bookmarks/comments/newsletter/push)', () => {
    recordEvent(ev({ name: 'share', url: 'https://wapo.test/a', sessionId: '1', props: { method: 'twitter' } }));
    recordEvent(ev({ name: 'share', url: 'https://wapo.test/a', sessionId: '2', props: { method: 'copy' } }));
    recordEvent(ev({ name: 'bookmark_toggle', url: 'https://wapo.test/a', sessionId: '1', props: { added: true } }));
    recordEvent(ev({ name: 'comment_post', url: 'https://wapo.test/a', sessionId: '1' }));
    recordEvent(ev({ name: 'newsletter_subscribe', url: 'https://wapo.test/a', sessionId: '1', props: { variant: 'inline' } }));
    recordEvent(ev({ name: 'push_subscribe', url: 'https://wapo.test/a', sessionId: '1' }));
    // A bookmark "removed" event should NOT count toward "bookmarks added"
    recordEvent(ev({ name: 'bookmark_toggle', url: 'https://wapo.test/a', sessionId: '1', props: { added: false } }));

    const stats = getStats(60);
    expect(stats.counts.shares).toBe(2);
    expect(stats.counts.bookmarks).toBe(1);
    expect(stats.counts.comments).toBe(1);
    expect(stats.counts.newsletterSignups).toBe(1);
    expect(stats.counts.pushSubscribes).toBe(1);
  });

  it('computes average scroll depth and duration for pages from pageview_end', () => {
    recordEvent(ev({ url: 'https://wapo.test/article/x', sessionId: 's1' }));
    recordEvent(ev({ name: 'pageview_end', url: 'https://wapo.test/article/x', sessionId: 's1', duration: 60, scrollDepth: 0.5 }));
    recordEvent(ev({ url: 'https://wapo.test/article/x', sessionId: 's2' }));
    recordEvent(ev({ name: 'pageview_end', url: 'https://wapo.test/article/x', sessionId: 's2', duration: 120, scrollDepth: 1.0 }));
    const stats = getStats(60);
    const page = stats.topPages.find((p) => p.path === '/article/x');
    expect(page).toBeTruthy();
    expect(page!.views).toBe(2);
    expect(page!.uniques).toBe(2);
    expect(page!.avgDuration).toBeCloseTo(90, 0);
    expect(page!.avgScrollDepth).toBeCloseTo(0.75, 2);
  });
});
