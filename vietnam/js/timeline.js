import { DAYS, SLOTS, mealsFor, sleepFor, slotFor } from './data/days.js';
import { KMH } from './data/geo.js';
import { HOP, FAR, hopOf } from './route.js';

// Hour-by-hour view of one planned day. Derived from the same plan the cards
// use: fixed transit keeps its clock times (`at` / `till` in days.js), open
// slots start at `at` or the slot default and run the packed picks back to
// back with a Grab gap between them. Meals go in the gaps. Nothing is invented
// beyond those gaps — and every assumption is listed in `notes`.
const START = { am: 8 * 60, pm: 13 * 60, night: 19 * 60 };
const END = { am: 12 * 60, pm: 18 * 60, night: 23.5 * 60 };
const MEAL = { am: ['Breakfast', 7.25 * 60, 30], pm: ['Lunch', 12 * 60, 45], night: ['Dinner', 18 * 60, 60] };
const DAY = 24 * 60;

const mins = (c) => {
  if (!c) return null;
  const [hm, plus] = c.split('+');
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + m + (plus ? DAY : 0);
};
export const clock = (t) => {
  const x = ((t % DAY) + DAY) % DAY;
  return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}${t > DAY ? ' +1' : ''}`;
};

const row = (kind, start, end, label, extra = {}) => ({ kind, start, end, label, ...extra });

// Arrival time when the night before was an overnight train / bus.
const arrivalOf = (day, transit) => {
  const prev = DAYS[day.n - 2];
  if (!prev) return null;
  const night = slotFor(prev, 'night', transit);
  const till = night.fixed && mins(night.till);
  return till != null && till >= DAY ? { t: till - DAY, text: night.text, icon: night.icon } : null;
};

const free = (rows, from, to, key, label = 'Free') => {
  if (to - from >= 15) rows.push(row('free', from, to, label, { key }));
};

// `inside` is a short label when the meal happens within another row (train, tour).
const mealRow = (rows, key, cursor, meal, before, inside = null) => {
  const [label, usual, len] = MEAL[key];
  if (!meal) return cursor;
  let t = Math.max(cursor, usual);
  if (before != null && t + len > before) t = Math.max(cursor, before - len);
  if (rows.length && !inside) free(rows, cursor, t, key);
  rows.push(row('eat', t, t + len, `${label} · ${meal.name}`, { key, meal, inside }));
  return t + len;
};

const isDayLong = (x) => x.slot === 'day' && !x.short;
// Timed picks (shows, tours) go first in clock order; drop-in picks (bars, beaches) fill in after.
const byClock = (p, q) => (mins(p.at) ?? Infinity) - (mins(q.at) ?? Infinity);
const firstAt = (s) => mins([...s.items].filter((x) => !x.cont).sort(byClock)[0]?.at);

// One open slot: picks in order, with gaps; returns the new cursor and stop.
const openSlot = (rows, notes, pd, s, key, cursor, prevStop) => {
  const items = s.items.filter((x) => !x.cont);
  if (!pd.custom) items.sort(byClock);
  let t = Math.max(cursor, firstAt(s) ?? mins(s.at) ?? START[key]);
  if (s.items.some((x) => x.cont && x.name === 'Night on board')) {
    rows.push(row('sleep', t, 23 * 60, 'Night on board the cruise', { key, overnight: true }));
    return { cursor: 23 * 60, stop: prevStop };
  }
  if (!items.length) {
    if (END[key] - t >= 15) rows.push(row('free', t, END[key], s.lead || 'Free · nothing packed', { key, empty: true }));
    return { cursor: Math.max(t, END[key]), stop: prevStop };
  }
  let stop = prevStop;
  let last = null;
  items.forEach((x, i) => {
    const hop = i === 0 ? null : hopOf(pd, last, x);
    const gap = hop ? hop.min : 0;
    if (gap) rows.push(row('hop', t, t + gap, hop.kind === 'est' ? `${hop.km} km · Grab / bike` : gap === FAR ? 'Grab to the next town' : 'Walk / GrabBike', { key, est: hop.kind === 'est' ? hop : null }));
    t += gap;
    const start = Math.max(t, mins(x.at) ?? 0);
    free(rows, t, start, key);
    const end = start + Math.round(x.h * 60);
    const limit = isDayLong(x) ? 21 * 60 : END[key] + 30;
    const late = end > limit;
    const missed = mins(x.at) != null && start > mins(x.at) + 15;
    rows.push(row('do', start, end, x.name, { key, x, late: late || missed }));
    if (late) notes.push(`${x.name} runs past ${clock(limit)} · trim it or move it`);
    if (missed) notes.push(`${x.name} starts ${clock(mins(x.at))} · you only get there ${clock(start)}`);
    t = end;
    stop = x.stop;
    last = x;
  });
  return { cursor: t, stop };
};

const fixedSlot = (rows, s, key, cursor) => {
  const start = mins(s.at) ?? Math.max(cursor, START[key]);
  const end = mins(s.till) ?? start + 60;
  if (key !== 'am') free(rows, cursor, start, key);
  rows.push(row('fixed', start, end, s.text, { key, icon: s.icon, overnight: end >= DAY }));
  return end;
};

// Sights ride along in the longest gap: they are not scheduled, just nearby.
const seeInto = (rows, see) => {
  if (!see?.length) return;
  const gap = rows.filter((r) => r.kind === 'free' && !r.empty && r.end - r.start >= 45).sort((a, b) => (b.end - b.start) - (a.end - a.start))[0];
  if (gap) { gap.label = 'Free · wander nearby'; gap.see = see; }
};

const conflicts = (rows, notes) => {
  const doing = rows.filter((r) => r.kind === 'do' || r.kind === 'fixed');
  doing.forEach((r, i) => {
    const n = doing[i + 1];
    if (n && n.start < r.end) notes.push(`${r.label} overlaps ${n.label}`);
  });
  const hours = rows.filter((r) => r.kind === 'do' && !isDayLong(r.x)).reduce((s, r) => s + (r.end - r.start), 0) / 60;
  if (hours > 9) notes.push(`${hours.toFixed(1)} h of picks · long day, drop one`);
  return notes;
};

// `pd` is the packed day from planTrip(); `day` the data record.
export function timelineFor(day, pd, transit) {
  const rows = [];
  const notes = [`Hops from straight-line distance at ~${KMH} km/h · ${HOP} min when a pick has no pin`];
  const meals = mealsFor(day, transit);
  const arrive = arrivalOf(day, transit);
  let cursor = 6.5 * 60;
  if (arrive) {
    rows.push(row('fixed', arrive.t - 90, arrive.t, arrive.text, { key: 'am', icon: arrive.icon, arrive: true }));
    cursor = arrive.t - 90;
  }
  let stop = day.stop;

  SLOTS.forEach((key, i) => {
    const s = pd.slots[key];
    if (s.fixed) {
      cursor = mealRow(rows, key, cursor, meals[i], mins(s.at));
      cursor = fixedSlot(rows, s, key, cursor);
      return;
    }
    if (arrive && key === 'am') {
      cursor = mealRow(rows, key, cursor, meals[i], arrive.t, 'on board');
      cursor = Math.max(cursor, arrive.t);
      ({ cursor, stop } = openSlot(rows, notes, pd, s, key, cursor, stop));
      return;
    }
    if (s.items.length && s.items.every((x) => x.cont && x.name !== 'Night on board')) {
      if (meals[i]) rows.push(row('eat', MEAL[key][1], MEAL[key][1] + MEAL[key][2], `${MEAL[key][0]} · ${meals[i].name}`, { key, meal: meals[i], inside: 'inside the tour' }));
      cursor = Math.max(cursor, MEAL[key][1] + MEAL[key][2]);
      return;
    }
    const slotStart = Math.max(cursor, firstAt(s) ?? mins(s.at) ?? START[key]);
    const fed = s.items.find((x) => x.eats === key);
    if (fed) rows.push(row('eat', slotStart, slotStart + MEAL[key][2], `${MEAL[key][0]} · ${fed.name}`, { key, meal: meals[i], inside: 'inside the tour' }));
    else cursor = mealRow(rows, key, cursor, meals[i], slotStart);
    ({ cursor, stop } = openSlot(rows, notes, pd, s, key, cursor, stop));
  });

  const sleep = sleepFor(day, transit);
  const last = rows[rows.length - 1];
  if (sleep?.usd && last && !last.overnight) {
    const bed = Math.max(last.end, 22 * 60);
    rows.push(row('sleep', bed, Math.max(bed + 30, 23 * 60), `Sleep · ${sleep.name}`, { key: 'night', sleep }));
  }

  rows.sort((a, b) => a.start - b.start);
  seeInto(rows, pd.see);
  return { rows, notes: conflicts(rows, notes) };
}
