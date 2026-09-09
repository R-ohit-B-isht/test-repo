import { TRIP, STOPS, isoOf } from './data/trip.js';
import { DAYS, sleepFor } from './data/days.js';
import { pinOf, STOP_GEO } from './data/geo.js';
import { now, today } from './clock.js';
import { daysLeft, phaseOf, tripDay } from './ritual.js';
import { findStrategy } from './strategies.js';
import { planTrip } from './plan.js';
import { timelineFor } from './timeline.js';
import { eventsFor } from './events.js';
import { slotsFor, recordOf, liveFiles } from './vault/slots.js';

// Today mode (Tripsy's "what's next" screen) — reads the same packed plan and
// hour-by-hour timeline as the day board and asks one question of the clock:
// which row is happening now, which is next, what is already behind us.
// Before the trip it shows the countdown and the next dated things; after it,
// the recap. Nothing here is stored; it is all derived from state + clock.

export const stopName = (id) => STOPS.find((s) => s.id === id)?.name || id;

export function phaseNow(d = now()) {
  const left = daysLeft();
  const p = phaseOf(left);
  return {
    phase: p === 'trip' ? 'trip' : p === 'after' ? 'after' : 'before',
    left,
    dayN: tripDay(left),
    mins: d.getHours() * 60 + d.getMinutes(),
    iso: today(),
  };
}

const statusOf = (r, mins) => (r.end <= mins ? 'done' : r.start <= mins ? 'now' : 'next');

// Rows that know where they happen: picks carry a stop, dinner and the bed
// are in tonight's town, breakfast is where last night's bed was.
const bedStop = (day, transit) => sleepFor(day, transit)?.stop || day.stop;
const ownStop = (r, day, transit) => {
  if (r.x?.stop) return r.x.stop;
  if (r.kind === 'sleep' || r.key === 'night') return bedStop(day, transit);
  if (r.key === 'am') return DAYS[day.n - 2] ? bedStop(DAYS[day.n - 2], transit) : day.stop;
  return null;
};

// Trains, flights, hops and free time sit between places: they belong to
// wherever the next placed row is (the far end), else the last one.
const MOVING = new Set(['fixed', 'hop', 'free']);
const fillStops = (rows, day, transit) => {
  const own = rows.map((r) => ownStop(r, day, transit));
  return rows.map((r, i) => {
    if (own[i]) return own[i];
    const back = own.slice(0, i).filter(Boolean).pop();
    const ahead = own.slice(i + 1).find(Boolean);
    return (MOVING.has(r.kind) ? ahead || back : back || ahead) || day.stop;
  });
};

// The day's timeline rows tagged done / now / next relative to the clock.
export function dayNow(state, ph) {
  const day = DAYS[ph.dayN - 1];
  const transit = findStrategy(state.strategy).transit;
  const plan = planTrip(state, transit);
  const raw = timelineFor(day, plan.days[day.n - 1], transit).rows;
  const stops = fillStops(raw, day, transit);
  const rows = raw.map((r, i) => ({ ...r, status: statusOf(r, ph.mins), stop: stops[i] }));
  const live = rows.filter((r) => r.status === 'now');
  const next = rows.filter((r) => r.status === 'next');
  const done = rows.filter((r) => r.status === 'done');
  return {
    day, plan, transit, rows,
    current: live[0] || null,
    next: next[0] || null,
    upcoming: next.slice(live.length ? 0 : 1),
    done,
    progress: rows.length ? done.length / rows.length : 0,
    stop: (live[0] || done.at(-1) || next[0])?.stop || day.stop,
    tomorrow: DAYS[day.n] || null,
    gap: !live.length && next[0] ? next[0].start - ph.mins : 0,
  };
}

// Manager slots that matter on this date: tickets for today's picks, the
// bed you sleep in, legs leaving today, plus passport / visa on Day 1.
export function ticketsOn(state, iso, dayN) {
  return slotsFor(state)
    .filter((s) => s.when === iso || (s.till && s.when <= iso && s.till >= iso) || (dayN === 1 && s.group === 'papers'))
    .map((s) => ({ slot: s, rec: recordOf(state, s.id), files: liveFiles(recordOf(state, s.id)) }));
}

export const ticketFor = (tickets, r) => tickets.find((t) => r.x && t.slot.id === `tix-${r.x.id}`) || null;

// Dated things after today, for the pre-trip screen (flights, book-by dates).
export const nextEvents = (state, iso, n = 4) => eventsFor(state)
  .filter((e) => e.iso >= iso && e.kind !== 'day' && e.kind !== 'spend' && !e.done)
  .slice(0, n);

// Where a row happens: a pick's pin, else the town centre.
export const pinFor = (r, stopId) => (r.x && pinOf(r.x)) || STOP_GEO[stopId] || null;

const enc = encodeURIComponent;
const placeOf = (r, stopId) => r.x?.name || r.meal?.name || r.sleep?.name || r.label.split(' · ').pop();

// Google Maps directions (universal URL) and the Grab app's booking screen;
// both fall back to a name search when a row has no pin. Trains, flights and
// free time have no destination to ride to.
export function goLinks(r, stopId) {
  if (r.kind === 'fixed' || r.kind === 'free' || r.kind === 'hop') return null;
  const pin = r.x ? pinOf(r.x) : null;
  const q = `${placeOf(r, stopId)} ${stopName(stopId)}`;
  const maps = pin
    ? `https://www.google.com/maps/dir/?api=1&destination=${pin[0]},${pin[1]}&travelmode=driving`
    : `https://www.google.com/maps/search/?api=1&query=${enc(q)}`;
  const grab = pin
    ? `grab://open?screenType=BOOKING&dropOffLatitude=${pin[0]}&dropOffLongitude=${pin[1]}&dropOffAddress=${enc(placeOf(r, stopId))}`
    : `grab://open?screenType=BOOKING&dropOffKeyword=${enc(q)}`;
  return { maps, grab, pinned: !!pin };
}

export const dayIso = (n) => isoOf(n);
export const tripStart = TRIP.start;
