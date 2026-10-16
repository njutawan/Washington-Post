// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    generateVAPIDKeys: () => ({ publicKey: 'pub', privateKey: 'priv' }),
    sendNotification: vi.fn(async (sub: { endpoint: string }) => {
      if (sub.endpoint.endsWith('/expired'))
        throw Object.assign(new Error('gone'), { statusCode: 410 });
    }),
  },
}));
import {
  addSubscription,
  removeSubscription,
  sendPush,
  getSubscriptionCount,
  isValidPushEndpoint,
} from '@/lib/push';
const sub = (path: string) => ({
  endpoint: 'https://fcm.googleapis.com/' + path,
  keys: { p256dh: 'key', auth: 'auth-secret' },
});
describe('push boundary', () => {
  it('persists subscriptions, prevents key replacement, and requires proof for removal', async () => {
    const a = sub('proof');
    expect(await addSubscription(a)).toBe(true);
    expect(
      await addSubscription({ ...a, keys: { ...a.keys, auth: 'attacker' } }),
    ).toBe(false);
    expect(await removeSubscription(a.endpoint, 'wrong')).toBe(false);
    expect(await removeSubscription(a.endpoint, a.keys.auth)).toBe(true);
  });
  it('sends and removes expired subscriptions without exposing endpoint URLs', async () => {
    await addSubscription(sub('ok'));
    await addSubscription(sub('expired'));
    const before = await getSubscriptionCount();
    const result = await sendPush({ title: 't', body: 'b', topic: 'breaking' });
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    expect(result).not.toHaveProperty('failures');
    expect(await getSubscriptionCount()).toBe(before - 1);
  });
  it.each([
    'https://127.0.0.1/a',
    'http://169.254.169.254/a',
    'https://fcm.googleapis.com.evil/a',
    'https://evil.fcm.googleapis.com/a',
    'https://fcm.googleapis.com:8443/a',
    'https://user:pass@fcm.googleapis.com/a',
    'https://fcm.googleapis.com/a#secret',
    'javascript:alert(1)',
    'not-url',
  ])('rejects SSRF endpoint %s', (url) =>
    expect(isValidPushEndpoint(url)).toBe(false),
  );
  it('permits exact supported public push hosts', () => {
    expect(
      isValidPushEndpoint(
        'https://updates.push.services.mozilla.com/wpush/v1/a',
      ),
    ).toBe(true);
  });
});
