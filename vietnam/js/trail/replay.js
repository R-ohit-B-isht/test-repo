import { TRIP, isoOf } from '../data/trip.js';
import { DAYS } from '../data/days.js';
import { STOP_GEO } from '../data/geo.js';
import { project } from '../data/map.js';
import { livePins, dayOfPin, nearStop, pathKm, OFF_PLAN_KM } from '../trail.js';

// Trail → map geometry and replay frames. Pure functions over state; the
// SVG layer (render/trl/layer.js) and the replay overlay consume these.

export const pinPoint = (p) => project(p.lat, p.lng);
export const toPolyline = (pts) => pts.map(([x, y]) => `${x},${y}`).join(' ');

const stopsOf = (pins) => [...new Set(pins.map((p) => nearStop(p.lat, p.lng)).filter((s) => s.km <= OFF_PLAN_KM).map((s) => s.id))];

// One frame per trip day, cumulative so the line grows as you step through.
export const replayFrames = (state) => {
  const pins = livePins(state);
  let cum = [];
  return DAYS.map((d) => {
    const mine = pins.filter((p) => dayOfPin(p) === d.n);
    cum = [...cum, ...mine];
    return { n: d.n, day: d, iso: isoOf(d.n), pins: mine, cum, km: Math.round(pathKm(mine)), stops: stopsOf(mine) };
  });
};

// Dev-only fixture: a plausible trail along the planned route, 2 pins a day,
// jittered ~1 km around each stop. Clearly synthetic; only the dev bar loads it.
export const devTrail = () => {
  const [y, m, d] = TRIP.start.split('-').map(Number);
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 - 0.5; };
  return DAYS.flatMap((day) => [10, 19].map((h, i) => {
    const [lat, lng] = STOP_GEO[day.stop];
    const t = new Date(y, m - 1, d + day.n - 1, h, 12).getTime();
    return { id: `gp-dev-${day.n}-${i}`, t, lat: Math.round((lat + rnd() * 0.02) * 1e5) / 1e5, lng: Math.round((lng + rnd() * 0.02) * 1e5) / 1e5, acc: 12 + Math.round(Math.abs(rnd()) * 40), day: day.n, deleted: false };
  }));
};
