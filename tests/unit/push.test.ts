import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock web-push to avoid actual network calls
vi.mock('web-push', () => {
  const subs: Array<{ endpoint: string; send: (m: string) => any }> = [];
  return {
    default: {
      setVapidDetails: () => {},
      sendNotification: vi.fn(async (sub: any, payload: string) => {
        if (sub.endpoint === 'https://expired.example.com') {
          const err: any = new Error('gone');
          err.statusCode = 410;
          throw err;
        }
        return { statusCode: 201, payload };
      }),
      generateVAPIDKeys: () => ({ public: 'pub', private: 'priv' }),
    },
  };
});

import { addSubscription, removeSubscription, sendPush, getSubscriptionCount } from '@/lib/push';

describe('push store', () => {
  beforeEach(() => {
    // No way to reset map from outside, but each test uses unique endpoints.
  });

  const makeSub = (endpoint: string) => ({
    endpoint,
    keys: { p256dh: 'a', auth: 'b' },
  });

  it('adds and lists subscriptions', () => {
    const before = getSubscriptionCount();
    addSubscription(makeSub(`https://push.example.com/${Math.random()}`), { topics: ['breaking'] });
    expect(getSubscriptionCount()).toBe(before + 1);
  });

  it('sends push messages to all topic subscribers', async () => {
    const e1 = `https://push.example.com/${Math.random()}`;
    const e2 = `https://push.example.com/${Math.random()}`;
    addSubscription(makeSub(e1), { topics: ['breaking'] });
    addSubscription(makeSub(e2), { topics: ['opinions'] });
    const result = await sendPush({
      title: 'BREAKING',
      body: 'Big news',
      topic: 'breaking',
      url: '/article/x',
    });
    expect(result.sent).toBeGreaterThanOrEqual(1);
    expect(result.failed).toBe(0);
  });

  it('removes expired (410) subscriptions automatically', async () => {
    const badEp = 'https://expired.example.com';
    addSubscription(makeSub(badEp), { topics: ['breaking'] });
    const before = getSubscriptionCount();
    await sendPush({ title: 't', body: 'b', topic: 'breaking' });
    // The 410 should have removed the bad endpoint.
    expect(getSubscriptionCount()).toBe(before - 1);
  });

  it('removeSubscription deletes by endpoint', () => {
    const ep = `https://push.example.com/${Math.random()}`;
    addSubscription(makeSub(ep));
    expect(removeSubscription(ep)).toBe(true);
  });
});
