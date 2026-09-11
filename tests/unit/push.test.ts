import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock web-push to avoid actual network calls
vi.mock('web-push', () => {
  return {
    default: {
      setVapidDetails: () => {},
      sendNotification: vi.fn(async (sub: any, payload: string) => {
        if (sub.endpoint.startsWith('https://expired.fcm.googleapis.com')) {
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

import {
  addSubscription,
  removeSubscription,
  sendPush,
  getSubscriptionCount,
  isValidPushEndpoint,
} from '@/lib/push';

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
    addSubscription(makeSub(`https://fcm.googleapis.com/fcm/v1/subscribe-${Math.random()}`), {
      topics: ['breaking'],
    });
    expect(getSubscriptionCount()).toBe(before + 1);
  });

  it('sends push messages to all topic subscribers', async () => {
    const e1 = `https://fcm.googleapis.com/fcm/v1/subscribe-${Math.random()}`;
    const e2 = `https://fcm.googleapis.com/fcm/v1/subscribe-${Math.random()}`;
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
    const badEp = 'https://expired.fcm.googleapis.com/fcm/v1/expired';
    addSubscription(makeSub(badEp), { topics: ['breaking'] });
    const before = getSubscriptionCount();
    await sendPush({ title: 't', body: 'b', topic: 'breaking' });
    // The 410 should have removed the bad endpoint.
    expect(getSubscriptionCount()).toBe(before - 1);
  });

  it('removeSubscription deletes by endpoint', () => {
    const ep = `https://fcm.googleapis.com/fcm/v1/subscribe-${Math.random()}`;
    addSubscription(makeSub(ep));
    expect(removeSubscription(ep)).toBe(true);
  });

  it('SSRF guard: only accepts https endpoints on known push services', () => {
    // Allowed
    expect(isValidPushEndpoint('https://fcm.googleapis.com/fcm/v1/x')).toBe(true);
    expect(isValidPushEndpoint('https://push.services.mozilla.com/wpush/v1/x')).toBe(true);

    // Rejected: internal / SSRF targets
    expect(isValidPushEndpoint('http://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(isValidPushEndpoint('https://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(isValidPushEndpoint('http://127.0.0.1:3000/api/feed')).toBe(false);
    expect(isValidPushEndpoint('https://127.0.0.1:3000/api/feed')).toBe(false);
    expect(isValidPushEndpoint('http://localhost:3000/')).toBe(false);
    expect(isValidPushEndpoint('https://internal.corp/')).toBe(false);
    expect(isValidPushEndpoint('https://evil.example.com/fcm/v1/x')).toBe(false);
    expect(isValidPushEndpoint('gopher://127.0.0.1/')).toBe(false);
    expect(isValidPushEndpoint('not a url')).toBe(false);
    expect(isValidPushEndpoint(undefined)).toBe(false);

    // And addSubscription enforces it.
    const before = getSubscriptionCount();
    addSubscription(makeSub('https://internal.corp/secret'));
    expect(getSubscriptionCount()).toBe(before);
  });
});
