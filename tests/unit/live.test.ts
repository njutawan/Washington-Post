import { describe, it, expect, beforeEach } from 'vitest';
import { getLiveUpdates, getUpdatesSince, addLiveUpdate, subscribe } from '@/lib/liveData';

describe('live blog store', () => {
  beforeEach(() => {
    // Reset store between tests by issuing a unique slug
  });

  it('seeds the shutdown-deal blog with entries', () => {
    const updates = getLiveUpdates('shutdown-deal');
    expect(updates.length).toBeGreaterThanOrEqual(6);
    // Newest first
    expect(updates[0].timestamp).toBeGreaterThan(updates[1].timestamp);
  });

  it('publishes new updates and notifies subscribers', () => {
    const slug = `test-blog-${Date.now()}`;
    const received: any[] = [];
    const unsub = subscribe(slug, (u) => received.push(u));
    addLiveUpdate(slug, { title: 'Hello', body: 'World' });
    unsub();
    expect(received).toHaveLength(1);
    expect(received[0].title).toBe('Hello');
    expect(received[0].id).toContain(slug);
    // And it's in the list
    const all = getLiveUpdates(slug);
    expect(all[0].title).toBe('Hello');
  });

  it('getUpdatesSince returns only newer updates', () => {
    const slug = `test-since-${Date.now()}`;
    addLiveUpdate(slug, { title: 'First', body: 'b' });
    const firstTs = getLiveUpdates(slug)[0].timestamp;
    addLiveUpdate(slug, { title: 'Second', body: 'b' });
    addLiveUpdate(slug, { title: 'Third', body: 'b' });
    const since = getUpdatesSince(slug, firstTs);
    expect(since.map((u) => u.title).sort()).toEqual(['Second', 'Third']);
  });

  it('returns empty array for unknown slug initially but accepts updates', () => {
    const slug = `unknown-${Date.now()}`;
    expect(getLiveUpdates(slug)).toEqual([]);
    addLiveUpdate(slug, { title: 'Only one', body: 'x' });
    expect(getLiveUpdates(slug)).toHaveLength(1);
  });
});
