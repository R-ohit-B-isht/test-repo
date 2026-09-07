// Map geometry shared by map.js and mapDays.js: equirectangular projection of
// the archipelago only, plus a zoom lens for the islets around Agatti. The
// mainland (Delhi, Kochi) is not toured, so it collapses to one anchor on the
// east edge that the arrival/departure legs run to.
import { PLACES, AGATTI_CLUSTER } from '../data/geo.js';

export const W = 260, H = 440, K = 108, LON0 = 71.7, LAT0 = 11.85;
export const LENS = { cx: 66, cy: 250, r: 56, k: 340, lon: 72.27, lat: 10.865 };
export const CLUSTER = AGATTI_CLUSTER;
export const OFFMAP = new Set(['Delhi', 'Kochi']);
export const EDGE = { x: 246, y: 160 };

export const proj = (name) => {
  if (OFFMAP.has(name)) return EDGE;
  const p = PLACES[name];
  return { x: (p.lon - LON0) * K, y: (LAT0 - p.lat) * K };
};
export const lens = (name) => {
  const p = PLACES[name];
  return { x: LENS.cx + (p.lon - LENS.lon) * LENS.k, y: LENS.cy - (p.lat - LENS.lat) * LENS.k };
};

// Quadratic arc a→b, bowing perpendicular by `bow`. Badge sits at t=0.5, or offset along
// short legs so the out/back badges of a there-and-back pair don't stack.
export function curve(a, b, bow) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const k = len < 140 ? 0.4 : 0.18;
  const cx = mx - dy * k * bow, cy = my + dx * k * bow;
  const t = len < 140 ? 0.62 : 0.5;
  const u = 1 - t;
  const mid = { x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y };
  return { d: `M${a.x} ${a.y}Q${cx} ${cy} ${b.x} ${b.y}`, mid };
}
