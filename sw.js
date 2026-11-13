// Service worker for the picks page. It shows the league script's push
// notifications and opens the page when one is tapped. It caches nothing, so the
// page always loads fresh.
'use strict';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let msg = {};
  try {
    msg = event.data ? event.data.json() : {};
  } catch (e) {
    msg = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil((async () => {
    // An open page refreshes itself right away instead of waiting for its next poll.
    const pages = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    pages.forEach(page => page.postMessage({ type: 'push' }));
    if (self.navigator.setAppBadge) self.navigator.setAppBadge().catch(() => {});
    // Every push must show a notification; iPhones stop delivering to pages that skip one.
    await self.registration.showNotification(msg.title || 'Slate Picks', {
      body: msg.body || '',
      // A newer notification with the same tag replaces the last one, and still alerts.
      tag: msg.tag || 'slate',
      renotify: true,
      icon: 'icon-180.png',
      badge: 'badge-96.png',
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const pages = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = pages.find(page => page.url.startsWith(self.registration.scope));
    if (open) return open.focus();
    return self.clients.openWindow(self.registration.scope);
  })());
});
