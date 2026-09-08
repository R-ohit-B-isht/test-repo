// Builds the dated plan for the current state: strategy blocks → days with
// picks grouped onto them, per-day spend items, and legs with actual dates.
// Pure and cheap; everything downstream (budget, map, cards) reads from here.
import { TRIP } from './data/trip.js';
import { BLOCKS } from './data/days.js';
import { STAYS } from './data/stays.js';
import { EATS } from './data/eats.js';
import { getStrategy } from './strategies.js';
import { fareFor } from './fares.js';
import { PACKAGE_FREE, isExtra } from './data/catalogue.js';
import { schedulePicks } from './grouping.js';

export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function pickItems(block, placed) {
  const seen = new Set();
  return placed.flatMap((item) => {
    if (!item.key || seen.has(item.key) || (block.pkg && PACKAGE_FREE.has(item.key))) return [];
    seen.add(item.key);
    return [{ key: item.key, pick: item.id }];
  });
}

function mealItems(block) {
  const paid = Object.values(block.meals).filter((id) => !EATS[id].incl).length;
  return paid ? [{ key: 'meal', qty: paid }] : [];
}

function stayItems(block) {
  const stay = STAYS[block.stay];
  return stay.key ? [{ key: stay.key, perRoom: Boolean(stay.perRoom) }] : [];
}

function dayFrom(id, i, placed) {
  const block = BLOCKS[id];
  return {
    ...block, id, n: i + 1, date: addDays(TRIP.start, i), picks: placed,
    sleepIcon: STAYS[block.stay].icon,
    items: [...block.spend, ...stayItems(block), ...mealItems(block), ...pickItems(block, placed)],
  };
}

// A fare read for one exact date only counts as "seen" when the leg falls on it.
function datedPrice(price, date) {
  const off = price.status === 'seen' && price.date && date && price.date !== date;
  return off ? { ...price, status: 'nearby' } : price;
}

// A leg happens on the first day that spends its fare (each day used once).
function withDates(legs, days) {
  const used = new Set();
  return legs.map((leg) => {
    const i = days.findIndex((d, k) => !used.has(k) && d.items.some((it) => it.key === leg.price.id));
    if (i >= 0) used.add(i);
    const date = i >= 0 ? days[i].date : undefined;
    return { ...leg, date, price: datedPrice(leg.price, date) };
  });
}

export function buildPlan(state) {
  const strategy = getStrategy(state.strategy);
  const blocks = strategy.days.map((id) => BLOCKS[id]);
  const { placed, skipped } = schedulePicks(blocks, state.picks);
  const days = strategy.days.map((id, i) => dayFrom(id, i, placed[i]));
  const legs = withDates(strategy.legs((key) => fareFor(key, state), state), days);
  const nights = days.slice(0, -1);

  return {
    strategy,
    days,
    legs,
    skipped,
    start: TRIP.start,
    end: days[days.length - 1].date,
    permitDue: addDays(TRIP.start, -TRIP.permitLeadDays),
    length: days.length,
    islandNights: nights.filter((d) => d.sleepIcon === 'home').length,
    seaNights: nights.filter((d) => d.sleepIcon === 'ship').length,
    travelHours: legs.reduce((s, l) => s + (l.package ? 0 : l.hours), 0),
    placedCount: placed.reduce((s, p) => s + p.length, 0),
    activityCount: placed.reduce((s, p) => s + p.filter((i) => !isExtra(i)).length, 0),
  };
}
