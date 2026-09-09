import { STOPS, inrFromVnd, inrFromUsd } from './data/trip.js';
import { DAYS, mealsFor, sleepFor } from './data/days.js';
import { GEO, STOP_GEO } from './data/geo.js';
import { EAT_GEO, STAY_GEO, HUBS, eatKey } from './data/places.js';
import { catalogOf, isFun, activityInr } from './data/activities.js';
import { findStrategy } from './strategies.js';
import { planTrip, dayOf } from './plan.js';
import { livePins, dayOfPin, nearStop } from './trail.js';

// Street map · the "Google Maps saved list" idea. One pin per thing the plan
// knows the exact spot of: picks on the plan (do / see), the switched-off
// picks nearby, the three meals a day, the beds, stations and airports.
// Every pin is derived from the same packed plan as the day board, so a toggle
// anywhere moves it here. Nothing without a looked-up coordinate is pinned.

export const KINDS = [
  { id: 'do', label: 'Do', icon: 'sparkle' },
  { id: 'see', label: 'See', icon: 'eye' },
  { id: 'eat', label: 'Eat', icon: 'bowl' },
  { id: 'sleep', label: 'Sleep', icon: 'bed' },
  { id: 'hub', label: 'Stations', icon: 'train' },
  { id: 'near', label: 'Not picked', icon: 'plus' },
];

const MEAL = ['Breakfast', 'Lunch', 'Dinner'];

export const CITIES = STOPS.map((s) => ({
  ...s,
  center: STOP_GEO[s.id],
  days: DAYS.filter((d) => d.stop === s.id).map((d) => d.n),
}));

export const cityOf = (id) => CITIES.find((c) => c.id === id) || CITIES[0];

const pin = (o, geo) => (geo ? { ...o, lat: geo[0], lng: geo[1] } : null);

// A Ninh Binh day starts with breakfast in Hanoi; the pin belongs to the town
// it is actually in, not to the day's headline stop.
const placed = (o, geo) => {
  const p = pin(o, geo);
  return p ? { ...p, stop: nearStop(p.lat, p.lng).id } : null;
};

const activityPins = (state, plan) => catalogOf(state).flatMap((x) => {
  if (x.closed) return [];
  const on = !!state.picks[x.id] && !plan.bundled.has(x.id);
  const day = on ? dayOf(plan, x.id) : null;
  const kind = !on || day == null ? 'near' : isFun(x) ? 'do' : 'see';
  const p = pin({
    id: `a-${x.id}`, pick: x.id, kind, name: x.name, sub: x.note || '', stop: x.stop, day,
    icon: x.icon, inr: activityInr(x, state.travellers), must: !!x.must, tag: x.tag || null,
  }, GEO[x.id]);
  return p ? [p] : [];
});

const mealPins = (transit) => DAYS.flatMap((day) => mealsFor(day, transit).flatMap((m, i) => {
  const key = eatKey(m.name);
  const p = placed({
    id: `e-${day.n}-${i}`, kind: 'eat', name: key, sub: `${MEAL[i]} · Day ${day.n} · ${m.dish}`, stop: day.stop, day: day.n,
    icon: 'bowl', inr: m.vnd ? inrFromVnd(m.vnd) : null, src: m.src,
  }, EAT_GEO[key]);
  return p ? [p] : [];
}));

const stayPins = (transit) => DAYS.flatMap((day) => {
  const s = sleepFor(day, transit);
  const p = placed({
    id: `s-${day.n}`, kind: 'sleep', name: s.name, sub: `Night of Day ${day.n} · ${s.area}`, stop: s.stop || day.stop, day: day.n,
    icon: 'bed', inr: s.usd ? inrFromUsd(s.usd) : null, src: s.src,
  }, STAY_GEO[s.name]);
  return p ? [p] : [];
});

const hubPins = () => HUBS.map((h) => ({ id: `h-${h.id}`, kind: 'hub', name: h.name, sub: '', stop: h.stop, day: null, icon: h.icon, inr: null, lat: h.lat, lng: h.lng }));

// Meals at the same table on two days collapse into one pin listing both days.
const merge = (pins) => {
  const seen = new Map();
  pins.forEach((p) => {
    const k = `${p.kind}|${p.name}|${p.lat}|${p.lng}`;
    const prev = seen.get(k);
    if (!prev) seen.set(k, { ...p, days: p.day != null ? [p.day] : [] });
    else if (p.day != null && !prev.days.includes(p.day)) { prev.days.push(p.day); prev.sub = `${prev.sub} · also Day ${p.day}`; }
  });
  return [...seen.values()];
};

export function mapPins(state) {
  const transit = findStrategy(state.strategy).transit;
  const plan = planTrip(state, transit);
  const pins = merge([...activityPins(state, plan), ...mealPins(transit), ...stayPins(transit), ...hubPins()]);
  const unpinned = catalogOf(state).filter((x) => !x.closed && !GEO[x.id] && state.picks[x.id] && dayOf(plan, x.id) != null);
  return { pins, unpinned, plan, transit };
}

export const pinsIn = (pins, stop) => pins.filter((p) => p.stop === stop);

// What the map opens on: the things on the plan. Unpicked spots and the
// airport stay just outside until you zoom out or press home.
export const onPlan = (pins) => pins.filter((p) => p.kind !== 'near' && p.kind !== 'hub');
export const byKind = (pins) => KINDS.map((k) => ({ ...k, pins: pins.filter((p) => p.kind === k.id) })).filter((k) => k.pins.length);

// The GPS trail (F2) is private state; here it is just drawn, never sent anywhere.
export const trailIn = (state, stop) => {
  const c = STOP_GEO[stop];
  return livePins(state).filter((p) => Math.abs(p.lat - c[0]) < 0.35 && Math.abs(p.lng - c[1]) < 0.35).map((p) => ({ ...p, day: dayOfPin(p) }));
};

// Bounding box of a set of points, padded so pins are not on the edge.
export const boundsOf = (pts, pad = 0.004) => {
  if (!pts.length) return null;
  const lat = pts.map((p) => p.lat);
  const lng = pts.map((p) => p.lng);
  return [[Math.min(...lat) - pad, Math.min(...lng) - pad], [Math.max(...lat) + pad, Math.max(...lng) + pad]];
};

export const mapsUrl = (p) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
export const grabUrl = (p) => `grab://open?screenType=BOOKING&dropOffLatitude=${p.lat}&dropOffLongitude=${p.lng}&dropOffAddress=${encodeURIComponent(p.name)}`;
