/* eslint-disable */
/* Service Worker v4 — offline caching + push notifications + background sync */
const CACHE_VERSION = 'wapo-v5';
const STATIC_CACHE = 'wapo-static-v5';
const PAGES_CACHE = 'wapo-pages-v5';
const PRECACHE_URLS = ['/', '/offline', '/politics', '/opinions', '/newsletters'];
const OFFLINE_QUEUE = 'wapo-offline-queue';
const BG_SYNC_TAG = 'wapo-bg-sync';
const MAX_CACHED_PAGES = 60; // bound the page cache so it can't grow forever

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {})),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

// ---------- Push notifications ----------
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'The Washington Post', body: event.data.text() };
  }
  const title = payload.title || 'The Washington Post';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/badge-72.png',
    image: payload.image,
    tag: payload.tag || 'wapo-breaking',
    data: payload.data || { url: payload.url || '/' },
    renotify: true,
    requireInteraction: !!payload.requireInteraction,
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Read now' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  if (event.action === 'dismiss') return;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing tab if it's already open to the origin
      for (const wc of windowClients) {
        if (wc.url && new URL(wc.url).origin === self.location.origin && 'focus' in wc) {
          wc.postMessage?.({ type: 'navigate', url });
          return wc.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});

// ---------- Background sync: replay queued POST/PUT/DELETE when back online ----------
self.addEventListener('sync', (event) => {
  if (event.tag === BG_SYNC_TAG) {
    event.waitUntil(replayOfflineQueue());
  }
});

async function queueOfflineRequest(request) {
  // Store serializable request in the queue cache (using a synthetic URL).
  const clone = request.clone();
  const body = await clone.text().catch(() => '');
  const entry = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body,
    queuedAt: Date.now(),
  };
  const queue = await caches.open(OFFLINE_QUEUE);
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const resp = new Response(JSON.stringify(entry), { headers: { 'content-type': 'application/json' } });
  await queue.put(key, resp);
  return key;
}

async function replayOfflineQueue() { await caches.delete(OFFLINE_QUEUE); return []; }

/**
 * Privacy guard: never cache responses the server marked private.
 * Signed-in pages embed the session in the HTML (RSC payload), so the
 * server sends `Cache-Control: private, no-store` on them — caching such a
 * page would leak the previous user's data on shared devices (CWE-200).
 */
function isCacheable(res) {
  if (!res || res.status !== 200) return false;
  const cc = (res.headers.get('cache-control') || '').toLowerCase();
  return !cc.includes('no-store') && !cc.includes('private');
}

/**
 * Keep the page cache bounded: drop the oldest entries beyond the cap.
 * Cache.keys() is returned in insertion order by browsers, so evicting from
 * the front is a good-enough LRU for offline navigation. Always keep the
 * offline fallback page.
 */
async function putPage(request, res) {
  if (!isCacheable(res)) return;
  try {
    const cache = await caches.open(PAGES_CACHE);
    await cache.put(request, res.clone());
    const keys = await cache.keys();
    const evictable = keys.filter((k) => new URL(k.url).pathname !== '/offline');
    if (evictable.length > MAX_CACHED_PAGES) {
      const toDelete = evictable.slice(0, evictable.length - MAX_CACHED_PAGES);
      await Promise.all(toDelete.map((k) => cache.delete(k)));
    }
  } catch (e) {
    /* cache is best-effort */
  }
}

// ---------- Fetch handling ----------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  // Never intercept the SSE /api/live stream or auth callbacks — let those fall through
  if (url.pathname.startsWith('/api/live/updates')) return;
  if (url.pathname.startsWith('/api/auth/')) return;

  // Mutations are never persisted/replayed: account changes would change their authority.
  if (url.pathname.startsWith('/api/') && request.method !== 'GET') return;

  if (request.method !== 'GET') return;

  // HTML pages: network-first, cache fallback -> offline page
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            putPage(request, res);
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/offline')),
        ),
    );
    return;
  }

  // API responses are always network-only, never cache private account data.
  if (url.pathname.startsWith('/api/')) return;

  // Static assets: stale-while-revalidate
  if (['style', 'script', 'font', 'image'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              const resClone = res.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, resClone));
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      }),
    );
  }
});

// Fallback: if background sync isn't supported, listen for the online event and replay
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'replay-queue') {
    event.waitUntil(replayOfflineQueue());
  }
  if (event.data && event.data.type === 'skip-waiting') {
    self.skipWaiting();
  }
});
