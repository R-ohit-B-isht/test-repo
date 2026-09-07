// Map geometry shared by map.js and mapDays.js: equirectangular projection of
// real coordinates, plus a zoom lens for the Agatti–Kavaratti cluster.
import { PLACES } from '../data/geo.js';

export const W = 260, H = 560, K = 25.5, LON0 = 69.6, LAT0 = 29.7;
export const LENS = { cx: 78, cy: 300, r: 72, k: 110, lon: 72.41, lat: 10.75 };
export const CLUSTER = new Set(['Agatti', 'Bangaram', 'Kavaratti']);

export const proj = (name) => {
  const p = PLACES[name];
  return { x: (p.lon - LON0) * K, y: (LAT0 - p.lat) * K };
};
export const lens = (name) => {
  const p = PLACES[name];
  return { x: LENS.cx + (p.lon - LENS.lon) * LENS.k, y: LENS.cy - (p.lat - LENS.lat) * LENS.k };
};

// Where a place is drawn given the current lens visibility.
export const locate = (name, showLens) => (showLens && CLUSTER.has(name) ? lens(name) : proj(name));

// Quadratic arc a→b, bowing perpendicular by `bow`. Badge sits at t=0.5, or offset along
// short legs so the out/back badges of a there-and-back pair don't stack.
export function curve(a, b, bow) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const cx = mx - dy * 0.18 * bow, cy = my + dx * 0.18 * bow;
  const t = len < 140 ? 0.62 : 0.5;
  const u = 1 - t;
  const mid = { x: u * u * a.x + 2 * u * t * cx + t * t * b.x, y: u * u * a.y + 2 * u * t * cy + t * t * b.y };
  return { d: `M${a.x} ${a.y}Q${cx} ${cy} ${b.x} ${b.y}`, mid };
}
