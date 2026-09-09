import { TILE_CACHE, templateOf, tileUrl, cityTiles, retina } from './tiles.js';

// Offline tiles · Cache Storage adapter. "Save this city" downloads the tile
// set from tiles.js into the same cache the service worker reads first, so the
// map keeps drawing on the night train. A per-city manifest (a synthetic
// same-origin entry) remembers what was saved; nothing else is stored.

const PARALLEL = 6;
const manifestKey = (stop) => `${location.origin}/__tiles__/${stop}`;

export const canSave = () => typeof caches !== 'undefined' && typeof fetch === 'function';

export async function savedInfo(stop) {
  if (!canSave()) return null;
  const c = await caches.open(TILE_CACHE);
  const hit = await c.match(manifestKey(stop));
  return hit ? hit.json() : null;
}

export async function saveCity(city, bounds, pts, theme, onProgress, signal) {
  const c = await caches.open(TILE_CACHE);
  const tpl = templateOf(theme);
  const tiles = cityTiles(bounds, pts);
  const p = { done: 0, total: tiles.length, bytes: 0, failed: 0 };
  const queue = tiles.slice();
  const urls = new Set();
  const one = async (t) => {
    const url = tileUrl(tpl, t);
    urls.add(url);
    if (await c.match(url)) return;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(String(res.status));
    p.bytes += (await res.clone().blob()).size;
    await c.put(url, res);
  };
  const worker = async () => {
    while (queue.length && !signal?.aborted) {
      try { await one(queue.shift()); } catch (err) { if (err?.name === 'AbortError') return; p.failed += 1; }
      p.done += 1;
      onProgress?.({ ...p });
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  if (signal?.aborted) return null;
  const prev = (await savedInfo(city.id)) || {};
  const info = {
    stop: city.id, theme, r: retina(), n: p.total - p.failed, failed: p.failed, at: Date.now(),
    bytes: (prev.theme === theme ? prev.bytes || 0 : 0) + p.bytes,
    urls: [...new Set([...(prev.urls || []), ...urls])],
  };
  await c.put(manifestKey(city.id), new Response(JSON.stringify(info), { headers: { 'content-type': 'application/json' } }));
  return info;
}

// Removes exactly what was saved (the manifest keeps the URL list, so tiles
// saved under an older set of pins go too), plus today's set as a fallback.
export async function forgetCity(city, bounds, pts) {
  const c = await caches.open(TILE_CACHE);
  const prev = (await savedInfo(city.id)) || {};
  const tiles = cityTiles(bounds, pts);
  const urls = new Set(prev.urls || []);
  ['light', 'dark'].forEach((theme) => ['', '@2x'].forEach((r) => tiles.forEach((t) => urls.add(tileUrl(templateOf(theme), t, r)))));
  await Promise.all([...urls].map((u) => c.delete(u)));
  await c.delete(manifestKey(city.id));
}

export async function storageUsed() {
  try {
    const { usage, quota } = await navigator.storage.estimate();
    return { usage, quota };
  } catch { return null; }
}

export const mb = (bytes) => `${(bytes / 1048576).toFixed(bytes < 10485760 ? 1 : 0)} MB`;
