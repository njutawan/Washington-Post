/**
 * Server-side Web Push helpers.
 *
 * A fixed VAPID keypair in source control would be a credential leak. If the
 * deployment does not provide keys via env, we generate a per-process keypair in
 * local/test runs so the demo continues to work without committing any secret.
 * Production deployments should still set real env keys.
 *
 * Subscriptions are stored in an in-memory Set for demo purposes — replace
 * with a database table in production.
 */

import webpush from 'web-push';
import type { PushSubscription as WebPushSubscription } from 'web-push';

const generatedKeys =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC && process.env.VAPID_PRIVATE
    ? null
    : webpush.generateVAPIDKeys();

const generatedPublicKey =
  generatedKeys && 'publicKey' in generatedKeys ? generatedKeys.publicKey : (generatedKeys as { public?: string } | null)?.public;
const generatedPrivateKey =
  generatedKeys && 'privateKey' in generatedKeys ? generatedKeys.privateKey : (generatedKeys as { private?: string } | null)?.private;

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC || generatedPublicKey || '';
const PRIVATE_KEY = process.env.VAPID_PRIVATE || generatedPrivateKey || '';
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:push@wapo-clone.example.com';

if (PUBLIC_KEY && PRIVATE_KEY) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
} else if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line no-console
  console.warn(
    '[push] Missing VAPID keys: set NEXT_PUBLIC_VAPID_PUBLIC and VAPID_PRIVATE to enable web push.',
  );
}

export function getVapidPublicKey() {
  return PUBLIC_KEY || '';
}

// ---------- Subscription store ----------
// Map of endpoint -> full subscription object + metadata
type StoredSub = {
  sub: WebPushSubscription;
  topics: Set<string>;
  addedAt: number;
  userAgent?: string;
};
const subs = new Map<string, StoredSub>();

/**
 * SSRF guard (CWE-918): `web-push` will HTTP-POST to whatever URL is stored
 * as the subscription endpoint. An attacker who can register a subscription
 * (the endpoint is public) could point it at an internal address
 * (e.g. http://169.254.169.254/ for cloud metadata, or http://127.0.0.1:3000)
 * and have the server issue the request when a push is sent. We only accept
 * https endpoints on known public push-service hosts.
 */
const ALLOWED_PUSH_HOSTS = new Set([
  'fcm.googleapis.com',
  'push.services.mozilla.com',
]);

export function isValidPushEndpoint(endpoint: unknown): boolean {
  if (typeof endpoint !== 'string') return false;
  let u: URL;
  try {
    u = new URL(endpoint);
  } catch {
    return false;
  }
  if (u.protocol !== 'https:') return false;
  const host = u.hostname.toLowerCase();
  return (
    ALLOWED_PUSH_HOSTS.has(host) ||
    [...ALLOWED_PUSH_HOSTS].some((h) => host.endsWith(`.${h}`))
  );
}

/**
 * Hard cap on stored subscriptions. The store is in-memory (demo) and fed by
 * a public endpoint — without a cap an attacker could grow the process's
 * memory by POSTing unique endpoint strings forever. When full we evict the
 * oldest subscriptions first.
 */
const MAX_SUBSCRIPTIONS = 10_000;

function evictOldestIfNeeded() {
  while (subs.size >= MAX_SUBSCRIPTIONS) {
    let oldestKey: string | null = null;
    let oldestAt = Infinity;
    for (const [key, s] of subs) {
      if (s.addedAt < oldestAt) {
        oldestAt = s.addedAt;
        oldestKey = key;
      }
    }
    if (oldestKey === null) break;
    subs.delete(oldestKey);
  }
}

export function addSubscription(
  subscription: WebPushSubscription,
  opts: { topics?: string[]; userAgent?: string } = {},
) {
  if (!subscription?.endpoint || !PUBLIC_KEY || !PRIVATE_KEY) return false;
  // SSRF guard — reject endpoints that aren't a known public push service.
  if (!isValidPushEndpoint(subscription.endpoint)) return false;
  const isNew = !subs.has(subscription.endpoint);
  if (isNew) evictOldestIfNeeded();
  const existing = subs.get(subscription.endpoint);
  subs.set(subscription.endpoint, {
    sub: subscription,
    topics: new Set(opts.topics || ['breaking']),
    addedAt: existing?.addedAt || Date.now(),
    userAgent: opts.userAgent || existing?.userAgent,
  });
  return true;
}

export function removeSubscription(endpoint: string) {
  return subs.delete(endpoint);
}

export function listSubscriptions(topic?: string): StoredSub[] {
  const all = Array.from(subs.values());
  if (!topic) return all;
  return all.filter((s) => s.topics.has(topic));
}

export function getSubscriptionCount() {
  return subs.size;
}

// ---------- Sending ----------
export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  image?: string;
  topic?: string;      // filter to subscribers who opted in to this topic
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
};

export async function sendPush(payload: PushPayload) {
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    return { sent: 0, failed: 0, disabled: true };
  }

  const targets = listSubscriptions(payload.topic);
  if (!targets.length) return { sent: 0, failed: 0 };

  const message = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/badge-72.png',
    tag: payload.tag || 'wapo-breaking',
    url: payload.url || '/',
    image: payload.image,
    requireInteraction: !!payload.requireInteraction,
    data: { url: payload.url || '/', ...(payload.data || {}) },
  });

  let sent = 0;
  let failed = 0;
  const failures: Array<{ endpoint: string; statusCode?: number }> = [];

  await Promise.all(
    targets.map(async ({ sub }) => {
      try {
        await webpush.sendNotification(sub, message, {
          TTL: 60 * 15, // 15 minutes
          urgency: 'high',
        });
        sent++;
      } catch (err: any) {
        failed++;
        failures.push({ endpoint: sub.endpoint, statusCode: err?.statusCode });
        // 410 Gone / 404 = subscription expired, remove it
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          subs.delete(sub.endpoint);
        }
      }
    }),
  );

  return { sent, failed, failures };
}
