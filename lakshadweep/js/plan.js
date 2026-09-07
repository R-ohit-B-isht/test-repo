// Builder: strategy + start date → a dated, numbered day list plus derived
// facts (end date, permit deadline, nights at sea, island days, travel hours).
import { BLOCKS } from './data/days.js';
import { TRIP } from './data/trip.js';
import { PRICES } from './data/prices.js';
import { getStrategy } from './strategies.js';

export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const ISLAND_SLEEP = new Set(['home']);
const SEA_SLEEP = new Set(['ship']);

export function buildPlan(state) {
  const strategy = getStrategy(state.strategy);
  const days = strategy.days.map((id, i) => ({ ...BLOCKS[id], id, n: i + 1, date: addDays(TRIP.start, i) }));
  const legs = strategy.legs(PRICES, state);
  const nights = days.slice(0, -1);
  return {
    strategy,
    days,
    legs,
    start: TRIP.start,
    end: days[days.length - 1].date,
    permitDue: addDays(TRIP.start, -TRIP.permitLeadDays),
    length: days.length,
    islandNights: nights.filter((d) => ISLAND_SLEEP.has(d.sleepIcon)).length,
    seaNights: nights.filter((d) => SEA_SLEEP.has(d.sleepIcon)).length,
    travelHours: legs.reduce((s, l) => s + (l.package ? 0 : l.hours), 0),
  };
}
