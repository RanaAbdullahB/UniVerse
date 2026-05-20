/**
 * sw.js — UniVerse Service Worker
 *
 * Handles:
 * 1. Offline caching (cache-first for static assets, network-first for API)
 * 2. Web Push notifications
 * 3. Background sync readiness
 */

const CACHE_NAME = 'universe-v2';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/manifest.json',
  '/lgulogo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ─── Install: pre-cache essential assets ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW: Some assets failed to cache during install:', err);
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  event.waitUntil(clients.claim());
});

// ─── Fetch: smart caching strategy ────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Admin/analytics API: always network (avoid stale empty/error payloads in PWA)
  if (url.pathname.startsWith('/api/admin/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Other API requests: network-first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets & pages: cache-first, fall back to network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (
            response.ok &&
            (url.origin === self.location.origin ||
              url.hostname === 'fonts.googleapis.com' ||
              url.hostname === 'fonts.gstatic.com')
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          if (request.destination === 'document') {
            return caches.match('/');
          }
        });
    })
  );
});

// ─── Push received ────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'UniVerse', body: event.data.text(), icon: '/lgulogo.png' };
  }

  const {
    title = 'UniVerse',
    body  = '',
    icon  = '/lgulogo.png',
    badge = '/lgulogo.png',
    tag,
    url   = '/',
    data  = {}
  } = payload;

  const options = {
    body,
    icon,
    badge,
    tag,
    data:    { url, ...data },
    vibrate: [100, 50, 100],
    actions: payload.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
