import { catalogOf, lookup, activityInr, isExtra, isFun } from './data/activities.js';
import { DAYS, SLOTS, slotFor } from './data/days.js';

// Packs the switched-on activities into the open slots of the eight days.
// Rules: stay where the day is (slot.stops, first stop preferred), fit the
// hours, at most MAX_PER_DAY picks a day, one pick per slot before topping up.
// Must-dos, then multi-day and full-day items go first so they are never
// squeezed out by something small. Anything switched on that finds no room is
// reported as `noRoom` — the card shows it under Nearby with a hint instead of
// hiding it. Only `fun` picks are packed and counted; `see` picks (walks,
// temples, markets) ride along as "also see" on the first day at their stop —
// no slot, no hours, still priced.
export const MAX_PER_DAY = 4;

const mustFirst = (p, q) => !!q.must - !!p.must;

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
  see: [],
});

const dayStops = (d) => new Set(SLOTS.flatMap((k) => d.slots[k].stops || []));

const roomFor = (d, x, key) => {
  const s = d.slots[key];
  if (s.fixed || !s.stops.includes(x.stop)) return false;
  if (isDayLong(x) && !x.short) return d.slots.am.items.length === 0 && d.slots.pm.items.length === 0 && !d.slots.am.fixed && !d.slots.pm.fixed && d.slots.pm.stops.includes(x.stop);
  return s.left >= x.h;
};

const put = (d, x, key) => {
  if (isDayLong(x) && !x.short) {
    d.slots.am.items.push(x); d.slots.am.left = 0;
    d.slots.pm.items.push({ ...x, cont: true }); d.slots.pm.left = 0;
  } else {
    d.slots[key].items.push(x); d.slots[key].left -= x.h;
  }
  d.count += 1;
};

// A full-day pick with `min` hours can shrink to one open slot when no whole
// day is free (VinWonders after 14:00 on the landing day). Carries the hint.
const shortOf = (x, key, d) => ({ ...x, short: true, h: d.slots[key].left, hint: x.shortNote || 'short visit' });

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
  const d = days.filter((dd) => dd.count < MAX_PER_DAY && roomFor(dd, x, 'am')).sort((p, q) => stopRank(p, 'am', x) - stopRank(q, 'am', x))[0];
  if (d) { put(d, x, 'am'); placed.set(x.id, d.n); return; }
  if (!x.min) return;
  for (const key of ['pm', 'am']) {
    const dd = days.find((day) => day.count < MAX_PER_DAY && !day.slots[key].fixed && day.slots[key].stops.includes(x.stop) && day.slots[key].left >= x.min);
    if (dd) { put(dd, shortOf(x, key, dd), key); placed.set(x.id, dd.n); return; }
  }
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
      .sort((p, q) => mustFirst(p, q) || stopRank(d, key, p) - stopRank(d, key, q));
    while (fits.length && d.count < MAX_PER_DAY) {
      const x = fits.shift();
      if (!roomFor(d, x, key)) continue;
      put(d, x, key); placed.set(x.id, d.n);
      if (!topUp) break;
    }
  }));
};

// A switched-on sight joins the day that already has fun packed at its stop,
// else the first day that passes through that stop.
const attachSee = (days, x, seen) => {
  const at = days.filter((d) => dayStops(d).has(x.stop));
  const d = at.find((dd) => SLOTS.some((k) => dd.slots[k].items.some((i) => i.stop === x.stop))) || at[0];
  if (d) { d.see.push(x); seen.set(x.id, d.n); }
};

// Nearby for a day: things at that day's stops that are not on the cards.
// Fun first (that is what the slots are for), then sights, closed last.
const nearbyFor = (d, all, placed, seen, bundled, noRoom) => {
  const stops = dayStops(d);
  return all
    .filter((x) => stops.has(x.stop) && !placed.has(x.id) && !seen.has(x.id) && !bundled.has(x.id) && !isExtra(x))
    .sort((p, q) => (noRoom.includes(q.id) - noRoom.includes(p.id)) || (isFun(q) - isFun(p)) || mustFirst(p, q) || (!!p.closed - !!q.closed))
    .map((x) => ({ x, status: x.closed ? 'closed' : noRoom.includes(x.id) ? 'noroom' : 'off' }));
};

export function planTrip(state, transit) {
  const all = catalogOf(state);
  const on = all.filter((x) => state.picks[x.id] && !x.closed && !isExtra(x));
  const bundled = new Set(on.flatMap((x) => x.includes || []));
  const wanted = on.filter((x) => !bundled.has(x.id) && isFun(x)).sort(mustFirst);
  const days = DAYS.map((d) => emptyDay(d, transit));
  const placed = new Map();
  const seen = new Map();

  wanted.filter(isMulti).forEach((x) => placeMulti(days, x, placed));
  wanted.filter((x) => isDayLong(x) && !isMulti(x)).sort((p, q) => !!p.min - !!q.min).forEach((x) => placeDayLong(days, x, placed));
  const singles = wanted.filter((x) => !isDayLong(x) && !isMulti(x));
  fillSingles(days, singles, placed, false);
  fillSingles(days, singles, placed, true);
  on.filter((x) => !bundled.has(x.id) && !isFun(x)).forEach((x) => attachSee(days, x, seen));

  const noRoom = wanted.filter((x) => !placed.has(x.id)).map((x) => x.id);
  const nearby = days.map((d) => nearbyFor(d, all, placed, seen, bundled, noRoom));
  const paid = [...placed.keys(), ...seen.keys()].map((id) => lookup(state, id)).filter((x) => !x.food && activityInr(x, state.travellers) != null);
  const cost = paid.reduce((s, x) => s + activityInr(x, state.travellers), 0);

  return { days, placed, seen, bundled, noRoom, nearby, paid, cost };
}

export const dayOf = (plan, id) => plan.placed.get(id) ?? plan.seen.get(id) ?? null;
