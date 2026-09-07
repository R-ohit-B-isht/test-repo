import { ACTIVITIES, BY_ID, activityInr, isExtra } from './data/activities.js';
import { DAYS, SLOTS, slotFor } from './data/days.js';

// Packs the switched-on activities into the open slots of the eight days.
// Rules: stay where the day is (slot.stops, first stop preferred), fit the
// hours, at most MAX_PER_DAY picks a day, one pick per slot before topping up.
// Multi-day and full-day items go first so they are never squeezed out by
// something small. Anything switched on that finds no room is reported as
// `noRoom` — the card shows it under Nearby with a hint instead of hiding it.
export const MAX_PER_DAY = 4;

const slotKeys = (x) => (x.slot === 'any' || x.slot === 'day' ? ['am', 'pm'] : [x.slot]);
const isDayLong = (x) => x.slot === 'day';
const isMulti = (x) => x.spans > 1;

const emptyDay = (day, transit) => ({
  n: day.n,
  slots: Object.fromEntries(SLOTS.map((k) => {
    const s = slotFor(day, k, transit);
    return [k, s.fixed ? { ...s, items: [] } : { ...s, left: s.h, items: [] }];
  })),
  count: 0,
});

const roomFor = (d, x, key) => {
  const s = d.slots[key];
  if (s.fixed || !s.stops.includes(x.stop)) return false;
  if (isDayLong(x)) return d.slots.am.items.length === 0 && d.slots.pm.items.length === 0 && !d.slots.am.fixed && !d.slots.pm.fixed && d.slots.pm.stops.includes(x.stop);
  return s.left >= x.h;
};

const put = (d, x, key) => {
  if (isDayLong(x)) {
    d.slots.am.items.push(x); d.slots.am.left = 0;
    d.slots.pm.items.push({ ...x, cont: true }); d.slots.pm.left = 0;
  } else {
    d.slots[key].items.push(x); d.slots[key].left -= x.h;
  }
  d.count += 1;
};

// A 2-day cruise: day one as a full day, "night on board", day two as the return.
const placeMulti = (days, x, placed) => {
  for (let i = 0; i + x.spans <= days.length; i += 1) {
    const run = days.slice(i, i + x.spans);
    if (!run.every((d) => roomFor(d, x, 'am'))) continue;
    run.forEach((d, j) => put(d, j === 0 ? x : { ...x, cont: true, name: x.next || x.name }, 'am'));
    run.slice(0, -1).forEach((d) => {
      if (d.slots.night.fixed) return;
      d.slots.night.items.push({ ...x, cont: true, name: 'Night on board' }); d.slots.night.left = 0;
    });
    placed.set(x.id, run[0].n);
    return;
  }
};

const placeDayLong = (days, x, placed) => {
  const d = days.find((dd) => dd.count < MAX_PER_DAY && roomFor(dd, x, 'am'));
  if (d) { put(d, x, 'am'); placed.set(x.id, d.n); }
};

// Preference: the day's own stop first, then the order stops are listed in the slot.
const stopRank = (d, key, x) => d.slots[key].stops.indexOf(x.stop);

// One pass over every open slot. `topUp` false = one pick per slot, true = fill the hours.
const fillSingles = (days, singles, placed, topUp) => {
  days.forEach((d) => SLOTS.forEach((key) => {
    const s = d.slots[key];
    if (s.fixed || (!topUp && s.items.length) || d.count >= MAX_PER_DAY) return;
    const fits = singles
      .filter((x) => !placed.has(x.id) && slotKeys(x).includes(key) && roomFor(d, x, key))
      .sort((p, q) => stopRank(d, key, p) - stopRank(d, key, q));
    while (fits.length && d.count < MAX_PER_DAY) {
      const x = fits.shift();
      if (!roomFor(d, x, key)) continue;
      put(d, x, key); placed.set(x.id, d.n);
      if (!topUp) break;
    }
  }));
};

// Nearby for a day: things at that day's stops that are not on the cards.
const nearbyFor = (d, placed, bundled, noRoom) => {
  const stops = new Set(SLOTS.flatMap((k) => d.slots[k].stops || []));
  return ACTIVITIES
    .filter((x) => stops.has(x.stop) && !placed.has(x.id) && !bundled.has(x.id) && !isExtra(x))
    .sort((p, q) => (noRoom.includes(q.id) - noRoom.includes(p.id)) || (!!p.closed - !!q.closed))
    .map((x) => ({ x, status: x.closed ? 'closed' : noRoom.includes(x.id) ? 'noroom' : 'off' }));
};

export function planTrip(state, transit) {
  const on = ACTIVITIES.filter((x) => state.picks[x.id] && !x.closed && !isExtra(x));
  const bundled = new Set(on.flatMap((x) => x.includes || []));
  const wanted = on.filter((x) => !bundled.has(x.id));
  const days = DAYS.map((d) => emptyDay(d, transit));
  const placed = new Map();

  wanted.filter(isMulti).forEach((x) => placeMulti(days, x, placed));
  wanted.filter((x) => isDayLong(x) && !isMulti(x)).forEach((x) => placeDayLong(days, x, placed));
  const singles = wanted.filter((x) => !isDayLong(x) && !isMulti(x));
  fillSingles(days, singles, placed, false);
  fillSingles(days, singles, placed, true);

  const noRoom = wanted.filter((x) => !placed.has(x.id)).map((x) => x.id);
  const nearby = days.map((d) => nearbyFor(d, placed, bundled, noRoom));
  const paid = [...placed.keys()].map((id) => BY_ID[id]).filter((x) => !x.food && activityInr(x, state.travellers) != null);
  const cost = paid.reduce((s, x) => s + activityInr(x, state.travellers), 0);

  return { days, placed, bundled, noRoom, nearby, paid, cost };
}

export const dayOf = (plan, id) => plan.placed.get(id) ?? null;
