import { TRIP } from './data/trip.js';
import { GEO, STOP_GEO, kmBetween } from './data/geo.js';
import { BY_ID } from './data/activities.js';
import { now, isoLocal } from './clock.js';

// Trail · the Polarsteps idea, browser-only. You tap "I'm here" and the phone's
// GPS drops a pin: { id, t, lat, lng, acc, day, deleted }. Pins are private
// state (never in the share hash), soft-deleted like everything else, and the
// route map draws them over the planned line so you can see what you really did.
// Nothing here is guessed: no pin, no dot; a fix the browser refuses is an
// honest error state, not a made-up position.

const DAY_MS = 86400000;
export const NEAR_KM = 1.2;     // "near <landmark>" radius
export const OFF_PLAN_KM = 25;  // farther than this from every stop = off-plan pin

export const livePins = (state) => (state.trail || []).filter((p) => !p.deleted).sort((a, b) => a.t - b.t);

// Trip day for a timestamp (1..8) or null outside the window.
export const dayOfTime = (t) => {
  const [y, m, d] = TRIP.start.split('-').map(Number);
  const start = new Date(y, m - 1, d).getTime();
  const [Y, M, D] = isoLocal(new Date(t)).split('-').map(Number);
  const n = Math.floor((new Date(Y, M - 1, D).getTime() - start) / DAY_MS) + 1;
  return n >= 1 && n <= TRIP.days ? n : null;
};

export const dayOfPin = (p) => (p.day ?? dayOfTime(p.t));

// Geolocation, wrapped in a promise with named failure codes so the view can
// say exactly what happened. `t` is the app clock (dev pins move it), `at` the
// device fix time for reference.
export const locate = () => new Promise((resolve, reject) => {
  if (!('geolocation' in navigator)) return reject(Object.assign(new Error('This browser has no location'), { code: 'unsupported' }));
  navigator.geolocation.getCurrentPosition(
    (pos) => resolve({
      lat: Math.round(pos.coords.latitude * 1e5) / 1e5,
      lng: Math.round(pos.coords.longitude * 1e5) / 1e5,
      acc: Math.round(pos.coords.accuracy),
      at: pos.timestamp,
    }),
    (err) => {
      const code = err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable';
      const text = { denied: 'Location is blocked · allow it in the browser and try again', timeout: 'No fix in 15 s · step outside or try again', unavailable: 'Location unavailable right now' }[code];
      reject(Object.assign(new Error(text), { code }));
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
  );
  return undefined;
});

export const newPinId = () => `gp-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const pinFrom = (fix, t = now().getTime()) => ({
  id: newPinId(), t, lat: fix.lat, lng: fix.lng, acc: fix.acc, day: dayOfTime(t), deleted: false,
});

// Where is this pin? Nearest stop always; a named landmark when within NEAR_KM.
export const nearStop = (lat, lng) => Object.entries(STOP_GEO)
  .map(([id, ll]) => ({ id, km: kmBetween([lat, lng], ll) }))
  .sort((a, b) => a.km - b.km)[0];

export const nearPlace = (lat, lng) => {
  let best = null;
  for (const [id, ll] of Object.entries(GEO)) {
    const km = kmBetween([lat, lng], ll);
    if (km <= NEAR_KM && (!best || km < best.km)) best = { id, km, name: BY_ID[id]?.name || id };
  }
  return best;
};

export const whereIs = (p) => {
  const stop = nearStop(p.lat, p.lng);
  const place = nearPlace(p.lat, p.lng);
  return { stop, place, offPlan: stop.km > OFF_PLAN_KM };
};

export const pathKm = (pins) => pins.reduce((s, p, i) => (i ? s + kmBetween([pins[i - 1].lat, pins[i - 1].lng], [p.lat, p.lng]) : 0), 0);

export const pinsOn = (state, n) => livePins(state).filter((p) => dayOfPin(p) === n);

export const trailStats = (state) => {
  const pins = livePins(state);
  const days = new Set(pins.map(dayOfPin).filter(Boolean));
  const stops = new Set(pins.map((p) => nearStop(p.lat, p.lng)).filter((s) => s.km <= OFF_PLAN_KM).map((s) => s.id));
  const off = pins.filter((p) => nearStop(p.lat, p.lng).km > OFF_PLAN_KM).length;
  return { pins: pins.length, km: Math.round(pathKm(pins)), days: days.size, stops: stops.size, off };
};
