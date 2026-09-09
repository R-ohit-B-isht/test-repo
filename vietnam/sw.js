/* Service worker: the whole planner (pages, code, day heroes) is precached so the
   saved plan opens with no data. Photos from Wikimedia/Flickr and the Google fonts
   are cached as they are seen. Gemini, YouTube and booking sites are never cached.
   Street-map tiles (CARTO only) have two caches: the cities the user chose to
   save (`tiles-v1`, written by js/gmap/cache.js, kept across versions) and a
   small rolling cache of tiles seen while browsing. */
const VERSION = 'v19';
const SHELL = `shell-${VERSION}`;
const MEDIA = `media-${VERSION}`;
const MEDIA_MAX = 240;
const TILES = 'tiles-v1';
const TILES_SEEN = 'tiles-seen-v1';
const TILES_SEEN_MAX = 300;

const PAGES = ['index.html', 'days.html', 'picks.html', 'budget.html', 'calendar.html', 'book.html', 'manager.html', 'split.html', 'today.html', 'map.html', 'trip.html', 'score.html', 'journal.html', 'sources.html'];
const PRECACHE = [
  './', ...PAGES, 'manifest.webmanifest',
  'assets/favicon.svg', 'assets/wave.svg', 'assets/icon-192.png', 'assets/icon-512.png',
  'assets/photos/hanoi.jpg', 'assets/photos/halong.jpg', 'assets/photos/ninhbinh.jpg', 'assets/photos/hue.jpg', 'assets/photos/haivan.jpg',
  'assets/photos/danang.jpg', 'assets/photos/hoian.jpg', 'assets/photos/train.jpg', 'assets/photos/golden.jpg',
  'css/app.css', 'css/tokens.css', 'css/base.css', 'css/components.css', 'css/chrome.css', 'css/sections.css', 'css/pages.css',
  'css/picker.css', 'css/importer.css', 'css/board.css', 'css/brain.css', 'css/reel.css', 'css/timeline.css', 'css/order.css', 'css/hops.css', 'css/votes.css', 'css/ritual.css', 'css/book.css', 'css/calendar.css', 'css/manager.css', 'css/split.css', 'css/today.css', 'css/trail.css', 'css/gmap.css', 'css/mag.css', 'css/score.css', 'css/journal.css', 'css/sync.css', 'css/print.css',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css', 'vendor/leaflet/images/layers.png', 'vendor/leaflet/images/layers-2x.png',
  'vendor/leaflet/images/marker-icon.png', 'vendor/leaflet/images/marker-icon-2x.png', 'vendor/leaflet/images/marker-shadow.png',
  'js/app.js', 'js/pages.js', 'js/store.js', 'js/config.js', 'js/dom.js', 'js/icons.js', 'js/plan.js', 'js/strategies.js', 'js/timeline.js',
  'js/share.js', 'js/book.js', 'js/budget.js', 'js/dev.js', 'js/votes.js', 'js/ritual.js', 'js/clock.js', 'js/today.js', 'js/weather.js', 'js/trail.js', 'js/trail/replay.js',
  'js/chrome/shell.js', 'js/chrome/theme.js', 'js/chrome/scroll.js', 'js/chrome/keys.js', 'js/chrome/net.js',
  'js/data/trip.js', 'js/data/prices.js', 'js/data/sources.js', 'js/data/days.js', 'js/data/activities.js', 'js/data/checklist.js', 'js/data/ritual.js',
  'js/data/photos.js', 'js/data/pics.js', 'js/data/reels.js', 'js/data/map.js', 'js/data/geo.js', 'js/data/hops.js', 'js/data/places.js',
  'js/mag.js', 'js/render/mag.js', 'js/render/mg/spread.js', 'js/render/mg/pages.js',
  'js/gmap.js', 'js/gmap/tiles.js', 'js/gmap/cache.js', 'js/render/gmap.js', 'js/render/gm/leaflet.js', 'js/render/gm/view.js', 'js/render/gm/offline.js',
  'js/export/dates.js', 'js/export/ics.js', 'js/export/gcal.js', 'js/events.js', 'js/gcal/sync.js',
  'js/vault/slots.js', 'js/vault/db.js', 'js/vault/files.js', 'js/vault/parse.js',
  'js/split/model.js', 'js/split/math.js', 'js/split/csv.js', 'js/split/card.js', 'js/canvas.js',
  'js/score.js', 'js/score/card.js', 'js/render/score.js', 'js/render/sc/view.js',
  'js/journal.js', 'js/journal/exif.js', 'js/journal/files.js', 'js/render/journal.js', 'js/render/ingest.js', 'js/render/recap.js', 'js/render/jn/view.js',
  'js/sync.js', 'js/sync/client.js', 'js/sync/engine.js', 'js/render/sync.js',
  'js/brain/gemini.js', 'js/brain/context.js', 'js/brain/apply.js', 'js/brain/vibe.js',
  'js/render/hero.js', 'js/render/route.js', 'js/render/map.js', 'js/render/itinerary.js', 'js/render/dayboard.js', 'js/render/timeline.js', 'js/render/order.js', 'js/render/orderDrag.js', 'js/render/hops.js', 'js/route.js',
  'js/render/picker.js', 'js/render/picks.js', 'js/render/tile.js', 'js/render/gallery.js', 'js/render/budget.js', 'js/render/checklist.js',
  'js/render/links.js', 'js/render/calendar.js', 'js/render/export.js', 'js/render/brain.js', 'js/render/brainOut.js', 'js/render/vibe.js', 'js/render/reel.js', 'js/render/sources.js', 'js/render/votes.js', 'js/render/ritual.js',
  'js/render/sheet.js', 'js/render/gcalPanel.js', 'js/render/cal/month.js', 'js/render/cal/week.js', 'js/render/cal/agenda.js', 'js/render/cal/chips.js',
  'js/render/manager.js', 'js/render/mgr/card.js', 'js/render/mgr/head.js', 'js/render/mgr/peek.js', 'js/render/mgr/paste.js', 'js/render/importer.js', 'js/render/imp/view.js', 'js/brain/link.js',
  'js/render/split.js', 'js/render/spl/bits.js', 'js/render/spl/head.js', 'js/render/spl/balances.js', 'js/render/spl/ledger.js',
  'js/render/spl/form.js', 'js/render/spl/sheet.js', 'js/render/spl/actions.js',
  'js/render/today.js', 'js/render/tod/view.js', 'js/render/trail.js', 'js/render/replay.js', 'js/render/trl/layer.js', 'js/render/trl/view.js',
];

const NEVER = ['generativelanguage.googleapis.com', 'accounts.google.com', 'www.googleapis.com', 'calendar.google.com', 'api.open-meteo.com', 'youtube.com', 'youtube-nocookie.com', 'ytimg.com', 'open.er-api.com'];
const MEDIA_HOSTS = ['upload.wikimedia.org', 'live.staticflickr.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const TILE_HOST = /^[a-d]\.basemaps\.cartocdn\.com$/;
const TILE_PATH = /^\/(rastertiles\/voyager|dark_all)\/\d{1,2}\/\d+\/\d+(@2x)?\.png$/;
const isTile = (url) => url.protocol === 'https:' && TILE_HOST.test(url.hostname) && TILE_PATH.test(url.pathname) && !url.search;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, MEDIA, TILES, TILES_SEEN].includes(k)).map((k) => caches.delete(k))))
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

// Tiles: saved cities first, then tiles seen recently, then the network. Only
// CARTO tile URLs of the two styles the map uses ever get here; the rolling
// cache is count-capped and the saved one is written/removed by the page.
const tile = async (req) => {
  const saved = await caches.open(TILES);
  const hit = (await saved.match(req.url)) || (await (await caches.open(TILES_SEEN)).match(req.url));
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) {
    const seen = await caches.open(TILES_SEEN);
    seen.put(req.url, res.clone());
    trim(TILES_SEEN, TILES_SEEN_MAX);
  }
  return res;
};

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (NEVER.some((h) => url.hostname.endsWith(h))) return;
  if (url.origin === location.origin) return e.respondWith(shell(req));
  if (isTile(url)) return e.respondWith(tile(req));
  if (MEDIA_HOSTS.includes(url.hostname)) return e.respondWith(media(req));
});
