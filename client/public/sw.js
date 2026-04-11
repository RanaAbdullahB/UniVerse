/**
 * sw.js — UniVerse Service Worker
 * Place this file at: client/public/sw.js
 *
 * Handles incoming Web Push notifications and shows them
 * as native OS notifications. Also handles notification clicks.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
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
    tag,          // Collapses duplicate notifications of same type
    url   = '/',  // Where to navigate on click
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
      // If the app is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});