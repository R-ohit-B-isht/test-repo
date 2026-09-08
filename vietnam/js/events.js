import { TRIP, STOPS, isoOf } from './data/trip.js';
import { DAYS, whereFor } from './data/days.js';
import { PRICES } from './data/prices.js';
import { stepsFor } from './data/checklist.js';
import { findStrategy } from './strategies.js';
import { planTrip } from './plan.js';
import { timelineFor } from './timeline.js';
import { slotsFor, recordOf, liveFiles } from './vault/slots.js';
import { addDays, toMins } from './export/dates.js';

// One flat list of everything the calendar, the ICS file and Google Calendar
// need: trip days, fixed legs, picks and meals from the day timelines, the
// booking deadlines from the checklist, dated Manager records and your own
// events. Times are minutes from midnight in Vietnam (`tz: 'vn'`) except the
// Delhi departure (`tz: 'in'`); `start == null` means all day.
//
//   { id, kind, iso, start, end, tz, title, sub, icon, dayN, slot, x, meal, done }
//   kind: 'day' | 'flight' | 'ground' | 'do' | 'eat' | 'deadline' | 'doc' | 'custom'

export const KINDS = {
  day: { label: 'Trip day', icon: 'sun' },
  flight: { label: 'Flight', icon: 'plane' },
  ground: { label: 'Train / bus', icon: 'train' },
  do: { label: 'Activity', icon: 'sparkle' },
  eat: { label: 'Meal', icon: 'bowl' },
  deadline: { label: 'Book by', icon: 'clock' },
  doc: { label: 'Document', icon: 'file' },
  custom: { label: 'Yours', icon: 'star' },
};

const stopName = (id) => STOPS.find((s) => s.id === id)?.name || id;
const ev = (fields) => ({ start: null, end: null, tz: 'vn', sub: '', ...fields });

const dayEvents = (transit) => DAYS.map((day) => ev({
  id: `day${day.n}`, kind: 'day', iso: isoOf(day.n), dayN: day.n, icon: 'sun',
  title: `Day ${day.n} · ${day.title}`, sub: whereFor(day, transit) || stopName(day.stop), photo: day.photo,
}));

// A fixed leg row → the Manager slot that books it: same date, same mode,
// and when two share a day (round-trip + hop), the one whose departure matches.
const slotForLeg = (steps, iso, row) => {
  const same = steps.filter((c) => c.icon === row.icon && PRICES[c.price]?.iso === iso);
  return (same.find((c) => toMins(PRICES[c.price].range.match(/dep (\d\d:\d\d)/)?.[1]) === row.start) || same[0])?.id || null;
};

const KEEP = new Set(['do', 'fixed', 'eat']);
const rowEvents = (day, rows, steps) => {
  const iso = isoOf(day.n);
  return rows.filter((r) => KEEP.has(r.kind) && !r.inside && !r.arrive).map((r, i) => ev({
    id: `d${day.n}-${i}-${r.kind}`, kind: r.kind === 'fixed' ? (r.icon === 'plane' ? 'flight' : 'ground') : r.kind,
    iso, dayN: day.n, start: r.start, end: Math.max(r.end, r.start + 15), title: r.label, icon: r.icon || (r.kind === 'eat' ? 'bowl' : 'sparkle'),
    sub: r.x?.note || r.meal?.dish || '', where: r.x?.stop ? stopName(r.x.stop) : '', x: r.x, meal: r.meal,
    slot: r.kind === 'fixed' ? slotForLeg(steps, iso, r) : r.x && !r.x.food ? `tix-${r.x.id}` : null,
  }));
};

// Delhi departure the night before day 1 on open-jaw routes (India time).
const flyOut = (state, steps) => {
  const leg = findStrategy(state.strategy).legs(PRICES, state)[0];
  const f = leg.price;
  if (!f.iso || f.iso >= TRIP.start) return [];
  const dep = toMins(f.range.match(/dep (\d\d:\d\d)/)?.[1]) ?? 23 * 60;
  return [ev({
    id: 'flyout', kind: 'flight', iso: f.iso, dayN: 0, start: dep, end: dep + 60, tz: 'in', icon: 'plane',
    title: `Fly ${leg.from} → ${leg.to} · ${f.carrier}`, sub: `${f.range}. A fare seen on ${f.date}, not a booking.`, where: TRIP.origin,
    slot: steps.find((c) => PRICES[c.price] === f)?.id || null,
  })];
};

const deadlines = (state, steps) => steps.map((c) => ev({
  id: `by-${c.id}`, kind: 'deadline', iso: addDays(TRIP.start, -c.lead), icon: c.icon, title: c.title, sub: c.hint, slot: c.id, done: !!state.checklist[c.id],
}));

// Manager records with a date you typed (passport expiry, visa validity) or a
// file attached to a slot that has no date of its own.
const docs = (state) => slotsFor(state).flatMap((s) => {
  const rec = recordOf(state, s.id);
  if (!rec.date || !s.dateLabel) return [];
  const n = liveFiles(rec).length;
  return [ev({ id: `doc-${s.id}`, kind: 'doc', iso: rec.date, icon: s.icon, title: `${s.title} · ${s.dateLabel.toLowerCase()}`, sub: n ? `${n} file${n > 1 ? 's' : ''} in the Manager` : rec.ref ? `Ref ${rec.ref}` : '', slot: s.id })];
});

const custom = (state) => state.events.filter((e) => !e.deleted).map((e) => ev({
  id: e.id, kind: 'custom', iso: e.iso, start: e.start ?? null, end: e.end ?? null, tz: e.tz || 'vn', icon: 'star',
  title: e.title, sub: e.note || '', where: e.where || '', own: e,
}));

const order = (a, b) => a.iso.localeCompare(b.iso) || (a.start ?? -1) - (b.start ?? -1) || a.kind.localeCompare(b.kind);

export function eventsFor(state) {
  const transit = findStrategy(state.strategy).transit;
  const plan = planTrip(state, transit);
  const steps = stepsFor(state.strategy);
  const rows = DAYS.flatMap((day) => rowEvents(day, timelineFor(day, plan.days[day.n - 1], transit).rows, steps));
  return [...flyOut(state, steps), ...dayEvents(transit), ...rows, ...deadlines(state, steps), ...docs(state), ...custom(state)].sort(order);
}

export const onDate = (events, iso) => events.filter((e) => e.iso === iso);
export const inMonth = (events, ym) => events.filter((e) => e.iso.startsWith(ym));
export const findEvent = (events, id) => events.find((e) => e.id === id) || null;
