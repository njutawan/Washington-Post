/* eslint-disable */
/* Service Worker v2 — offline caching + push notifications + background sync */
const CACHE_VERSION = 'wapo-v2';
const STATIC_CACHE = 'wapo-static-v2';
const PAGES_CACHE = 'wapo-pages-v2';
const PRECACHE_URLS = ['/', '/offline', '/politics', '/opinions', '/newsletters'];
const OFFLINE_QUEUE = 'wapo-offline-queue';
const BG_SYNC_TAG = 'wapo-bg-sync';

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
        keys.filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE && k !== OFFLINE_QUEUE)
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

async function replayOfflineQueue() {
  const queue = await caches.open(OFFLINE_QUEUE);
  const keys = await queue.keys();
  const results = [];
  for (const req of keys) {
    const res = await queue.match(req);
    if (!res) continue;
    let entry;
    try { entry = await res.json(); } catch { continue; }
    try {
      await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: ['GET', 'HEAD'].includes(entry.method) ? undefined : entry.body,
        credentials: 'include',
      });
      await queue.delete(req);
      results.push({ key: req.url, ok: true });
    } catch (e) {
      // Still offline — leave in queue for next sync event.
      results.push({ key: req.url, ok: false });
    }
  }
  // Tell any open client tabs the queue drained (or was retried).
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((c) => c.postMessage?.({ type: 'bg-sync-complete', results }));
  return results;
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

  // Mutating API requests (POST/PUT/DELETE): attempt network; on failure, queue
  // for background sync replay when the client comes back online.
  if (
    url.pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)
  ) {
    event.respondWith(
      fetch(request.clone())
        .catch(async () => {
          await queueOfflineRequest(request);
          // Try to register a sync for replay; if not supported, replay on next online event.
          try {
            await self.registration.sync.register(BG_SYNC_TAG);
          } catch {}
          return new Response(JSON.stringify({ queued: true, offline: true }), {
            status: 202,
            headers: { 'content-type': 'application/json' },
          });
        }),
    );
    return;
  }

  if (request.method !== 'GET') return;

  // HTML pages: network-first, cache fallback -> offline page
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(PAGES_CACHE).then((cache) => cache.put(request, resClone));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match('/offline')),
        ),
    );
    return;
  }

  // GET API (non-mutating, non-SSE): network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, resClone));
          }
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

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
