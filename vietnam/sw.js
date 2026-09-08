/* Service worker: the whole planner (pages, code, day heroes) is precached so the
   saved plan opens with no data. Photos from Wikimedia/Flickr and the Google fonts
   are cached as they are seen. Gemini, YouTube and booking sites are never cached. */
const VERSION = 'v3';
const SHELL = `shell-${VERSION}`;
const MEDIA = `media-${VERSION}`;
const MEDIA_MAX = 240;

const PAGES = ['index.html', 'days.html', 'picks.html', 'budget.html', 'calendar.html', 'book.html', 'manager.html', 'sources.html'];
const PRECACHE = [
  './', ...PAGES, 'manifest.webmanifest',
  'assets/favicon.svg', 'assets/wave.svg', 'assets/icon-192.png', 'assets/icon-512.png',
  'assets/photos/hanoi.jpg', 'assets/photos/halong.jpg', 'assets/photos/ninhbinh.jpg', 'assets/photos/hue.jpg', 'assets/photos/haivan.jpg',
  'assets/photos/danang.jpg', 'assets/photos/hoian.jpg', 'assets/photos/train.jpg', 'assets/photos/golden.jpg',
  'css/app.css', 'css/tokens.css', 'css/base.css', 'css/components.css', 'css/chrome.css', 'css/sections.css', 'css/pages.css',
  'css/picker.css', 'css/board.css', 'css/brain.css', 'css/reel.css', 'css/timeline.css', 'css/book.css', 'css/calendar.css', 'css/manager.css', 'css/print.css',
  'js/app.js', 'js/pages.js', 'js/store.js', 'js/config.js', 'js/dom.js', 'js/icons.js', 'js/plan.js', 'js/strategies.js', 'js/timeline.js',
  'js/share.js', 'js/book.js', 'js/budget.js', 'js/dev.js',
  'js/chrome/shell.js', 'js/chrome/theme.js', 'js/chrome/scroll.js', 'js/chrome/keys.js', 'js/chrome/net.js',
  'js/data/trip.js', 'js/data/prices.js', 'js/data/sources.js', 'js/data/days.js', 'js/data/activities.js', 'js/data/checklist.js',
  'js/data/photos.js', 'js/data/pics.js', 'js/data/reels.js', 'js/data/map.js',
  'js/export/dates.js', 'js/export/ics.js', 'js/export/gcal.js', 'js/events.js', 'js/gcal/sync.js',
  'js/vault/slots.js', 'js/vault/db.js', 'js/vault/files.js',
  'js/brain/gemini.js', 'js/brain/context.js', 'js/brain/apply.js', 'js/brain/vibe.js',
  'js/render/hero.js', 'js/render/route.js', 'js/render/map.js', 'js/render/itinerary.js', 'js/render/dayboard.js', 'js/render/timeline.js',
  'js/render/picker.js', 'js/render/picks.js', 'js/render/tile.js', 'js/render/gallery.js', 'js/render/budget.js', 'js/render/checklist.js',
  'js/render/links.js', 'js/render/calendar.js', 'js/render/export.js', 'js/render/brain.js', 'js/render/brainOut.js', 'js/render/vibe.js', 'js/render/reel.js', 'js/render/sources.js',
  'js/render/sheet.js', 'js/render/gcalPanel.js', 'js/render/cal/month.js', 'js/render/cal/week.js', 'js/render/cal/agenda.js', 'js/render/cal/chips.js',
  'js/render/manager.js', 'js/render/mgr/card.js', 'js/render/mgr/head.js', 'js/render/mgr/peek.js',
];

const NEVER = ['generativelanguage.googleapis.com', 'accounts.google.com', 'www.googleapis.com', 'calendar.google.com', 'youtube.com', 'youtube-nocookie.com', 'ytimg.com'];
const MEDIA_HOSTS = ['upload.wikimedia.org', 'live.staticflickr.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, MEDIA].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});

const trim = async (name, max) => {
  const c = await caches.open(name);
  const keys = await c.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => c.delete(k)));
};

// Shell: network first so every module comes from the same build; the cache
// answers when offline or when the network is slow.
const SLOW_MS = 3000;
const shell = async (req) => {
  const c = await caches.open(SHELL);
  const hit = c.match(req, { ignoreSearch: true });
  const net = fetch(req).then((res) => {
    if (res.ok) c.put(req, res.clone());
    return res;
  }).catch(() => null);
  const slow = new Promise((r) => setTimeout(() => r(null), SLOW_MS));
  const res = (await Promise.race([net, slow])) || (await hit) || (await net);
  if (res) return res;
  if (req.mode === 'navigate') return c.match('index.html');
  return Response.error();
};

// Media: cache first, capped; a miss offline is a plain error the <img> handles.
const media = async (req) => {
  const c = await caches.open(MEDIA);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') {
    c.put(req, res.clone());
    trim(MEDIA, MEDIA_MAX);
  }
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (NEVER.some((h) => url.hostname.endsWith(h))) return;
  if (url.origin === location.origin) return e.respondWith(shell(req));
  if (MEDIA_HOSTS.includes(url.hostname)) return e.respondWith(media(req));
});
