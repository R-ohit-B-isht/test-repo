/* Imported into the generated service worker (vite.config.ts → workbox.importScripts). Shows routine reminders sent by
 * chat-api's reminder loop and opens the routine at the right slot when one is tapped. Payload shape (schedule.py):
 * { title, body, tag, slot, date, url } — url is a same-origin path such as /#/routine?slot=am&remind=am. */
/* eslint-env serviceworker */

const FALLBACK_URL = '/#/routine';

function parsePayload(event) {
  if (!event.data) return {};
  try { return event.data.json() || {}; } catch { return { body: event.data.text() }; }
}

self.addEventListener('push', (event) => {
  const p = parsePayload(event);
  const slot = p.slot === 'pm' ? 'pm' : 'am';
  const url = typeof p.url === 'string' && p.url.startsWith('/') ? p.url : `${FALLBACK_URL}?slot=${slot}&remind=${slot}`;
  const title = typeof p.title === 'string' && p.title ? p.title : slot === 'pm' ? 'Night routine' : 'Morning routine';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: typeof p.body === 'string' ? p.body : '',
      tag: typeof p.tag === 'string' ? p.tag : `routine-${slot}`,
      renotify: true,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url, slot, date: p.date || null },
      actions: [{ action: 'open', title: 'Open routine' }],
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || FALLBACK_URL;
  const target = new URL(url, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((c) => new URL(c.url).origin === self.location.origin);
      if (existing) {
        if ('navigate' in existing) {
          try { await existing.navigate(target); } catch { /* cross-origin or detached: fall through to focus */ }
        }
        return existing.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});
