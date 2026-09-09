// Slippy-map tile arithmetic (Web Mercator, 256 px tiles), pure functions.
// The base map is CARTO's free raster basemap (© OpenStreetMap contributors,
// © CARTO); one style per theme. `{r}` becomes "@2x" on retina screens.

export const TILE_CACHE = 'tiles-v1';
export const TILE_HOST = 'basemaps.cartocdn.com';
export const SUBS = ['a', 'b', 'c', 'd'];

export const STYLES = {
  light: { path: 'rastertiles/voyager', label: 'light' },
  dark: { path: 'dark_all', label: 'dark' },
};

export const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export const templateOf = (theme) => `https://{s}.${TILE_HOST}/${STYLES[theme]?.path || STYLES.light.path}/{z}/{x}/{y}{r}.png`;

export const retina = () => (typeof window !== 'undefined' && window.devicePixelRatio > 1 ? '@2x' : '');

export const tileUrl = (tpl, t, r = retina()) => tpl
  .replace('{s}', SUBS[(t.x + t.y) % SUBS.length])
  .replace('{z}', t.z).replace('{x}', t.x).replace('{y}', t.y).replace('{r}', r);

const rad = (d) => (d * Math.PI) / 180;

export const tileXY = (lat, lng, z) => {
  const n = 2 ** z;
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(((1 - Math.log(Math.tan(rad(lat)) + 1 / Math.cos(rad(lat))) / Math.PI) / 2) * n);
  return { x: Math.min(n - 1, Math.max(0, x)), y: Math.min(n - 1, Math.max(0, y)), z };
};

// All tiles covering [[south, west], [north, east]] at zoom z.
export const tilesIn = (bounds, z) => {
  const [[s, w], [n, e]] = bounds;
  const a = tileXY(n, w, z);
  const b = tileXY(s, e, z);
  const out = [];
  for (let y = a.y; y <= b.y; y += 1) for (let x = a.x; x <= b.x; x += 1) out.push({ x, y, z });
  return out;
};

// Tiles around one point: the tile it sits in plus `ring` tiles each side.
export const tilesAround = (lat, lng, z, ring) => {
  const c = tileXY(lat, lng, z);
  const out = [];
  for (let y = c.y - ring; y <= c.y + ring; y += 1) for (let x = c.x - ring; x <= c.x + ring; x += 1) out.push({ x, y, z });
  return out;
};

// The set worth saving for a city: the whole area at overview zooms, and
// street detail only around the pins you will actually stand at. Past
// MAX_TILES (≈25 MB retina) the save button is withheld rather than
// silently trimming the area.
export const MAX_TILES = 900;
export const AREA_ZOOMS = [11, 12, 13, 14];
export const DETAIL = [{ z: 15, ring: 1 }, { z: 16, ring: 1 }];

export const cityTiles = (bounds, pts) => {
  const keys = new Set();
  const out = [];
  const add = (t) => { const k = `${t.z}/${t.x}/${t.y}`; if (!keys.has(k)) { keys.add(k); out.push(t); } };
  AREA_ZOOMS.forEach((z) => tilesIn(bounds, z).forEach(add));
  DETAIL.forEach(({ z, ring }) => pts.forEach((p) => tilesAround(p.lat, p.lng, z, ring).forEach(add)));
  return out;
};

// CARTO raster tiles average about 15 kB at 1x and 30 kB at 2x in these towns.
export const estimateMb = (n, r = retina()) => Math.round((n * (r ? 30 : 15)) / 1024 * 10) / 10;
