import { describe, it, expect } from 'vitest';
import {
  getLiveUpdates,
  getUpdatesSince,
  addLiveUpdate,
  subscribe,
  isValidLiveSlug,
} from '@/lib/liveData';

// The store only accepts known live-blog slugs (security hardening), so all
// write tests run against the seeded demo blog.
const SLUG = 'shutdown-deal';

describe('live blog store', () => {
  it('seeds the shutdown-deal blog with entries', () => {
    const updates = getLiveUpdates(SLUG);
    expect(updates.length).toBeGreaterThanOrEqual(6);
    // Newest first
    expect(updates[0].timestamp).toBeGreaterThan(updates[1].timestamp);
  });

  it('publishes new updates and notifies subscribers', () => {
    const received: any[] = [];
    const unsub = subscribe(SLUG, (u) => received.push(u));
    addLiveUpdate(SLUG, { title: 'Hello', body: 'World' });
    unsub();
    expect(received).toHaveLength(1);
    expect(received[0].title).toBe('Hello');
    expect(received[0].id).toContain(SLUG);
    // And it's in the list
    const all = getLiveUpdates(SLUG);
    expect(all[0].title).toBe('Hello');
  });

  it('getUpdatesSince returns only newer updates', () => {
    addLiveUpdate(SLUG, { title: 'First', body: 'b' });
    const firstTs = getLiveUpdates(SLUG)[0].timestamp;
    addLiveUpdate(SLUG, { title: 'Second', body: 'b' });
    addLiveUpdate(SLUG, { title: 'Third', body: 'b' });
    const since = getUpdatesSince(SLUG, firstTs);
    expect(since.map((u) => u.title).sort()).toEqual(['Second', 'Third']);
  });

  it('only accepts known live-blog slugs (DoS guard)', () => {
    // Known slugs (canonical + legacy alias) are valid
    expect(isValidLiveSlug('shutdown-deal')).toBe(true);
    expect(isValidLiveSlug('shutdown-countdown')).toBe(true);

    // Arbitrary / malformed slugs are rejected
    expect(isValidLiveSlug('unknown-blog')).toBe(false);
    expect(isValidLiveSlug('')).toBe(false);
    expect(isValidLiveSlug('../../etc/passwd')).toBe(false);
    expect(isValidLiveSlug('a'.repeat(70))).toBe(false);
    expect(isValidLiveSlug(42 as any)).toBe(false);

    // Unknown slugs never create store entries…
    expect(getLiveUpdates('unknown-blog')).toEqual([]);
    expect(getUpdatesSince('unknown-blog', 0)).toEqual([]);
    // …and writes are refused outright.
    expect(() => addLiveUpdate('unknown-blog', { title: 'x', body: 'y' })).toThrow();
    // Subscribing to an unknown slug is a no-op (no simulation timer).
    expect(typeof subscribe('unknown-blog', () => {})).toBe('function');
  });
});
