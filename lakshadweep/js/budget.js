// Pure budget arithmetic. Input: state + data. Output: per-person ledger lines.
import { PRICES } from './data/prices.js';
import { DAYS } from './data/days.js';
import { getStrategy } from './strategies.js';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export const fmt = (n) => `₹${inr.format(Math.round(n))}`;

const ROOM_KEYS = new Set(['homestayAgattiRoom', 'homestayKavarattiRoom']);

function unitAmount(item, state) {
  if (ROOM_KEYS.has(item.key)) return state.homestayRate;
  if (item.key === 'shipSecond' && state.shipClass === 'first') return PRICES.shipFirst.amount;
  return PRICES[item.key].amount;
}

// Per-person cost of one spend item for the given party.
export function itemCost(item, state) {
  if (item.optional && !state.activities[item.optional]) return 0;
  const qty = item.qty || 1;
  const n = Math.max(1, state.travellers);
  const amount = unitAmount(item, state) * qty;
  if (item.perRoom) return (Math.ceil(n / 2) * amount) / n;
  if (item.perCar) return amount / n;
  return amount;
}

export function dayGroundCost(day, state) {
  return day.spend.filter((i) => !i.transport).reduce((s, i) => s + itemCost(i, state), 0);
}

export function dayTotal(day, state) {
  return day.spend.reduce((s, i) => s + itemCost(i, state), 0);
}

export function computeBudget(state) {
  const strategy = getStrategy(state.strategy);
  const legs = strategy.legs(PRICES, state);
  const transport = legs.reduce((s, l) => s + l.price.amount, 0);

  const buckets = { stay: 0, food: 0, local: 0, activities: 0 };
  for (const day of DAYS) {
    for (const item of day.spend) {
      if (item.transport) continue;
      const cost = itemCost(item, state);
      if (ROOM_KEYS.has(item.key) || item.key === 'hostelKochi') buckets.stay += cost;
      else if (item.key === 'meal') buckets.food += cost;
      else if (item.optional) buckets.activities += cost;
      else buckets.local += cost;
    }
  }
  const permit = PRICES.permit.amount;

  const lines = [
    { id: 'transport', label: `Delhi ⇄ islands · ${strategy.name}`, amount: transport },
    { id: 'stay', label: 'Nine nights (homestays + Kochi dorm)', amount: buckets.stay },
    { id: 'food', label: 'Meals not covered by homestays', amount: buckets.food },
    { id: 'local', label: 'Kochi buses and the pre-dawn cab', amount: buckets.local },
    { id: 'activities', label: 'Water sports, diving, day boats', amount: buckets.activities },
    { id: 'permit', label: 'Entry permit', amount: permit },
  ];
  const perPerson = lines.reduce((s, l) => s + l.amount, 0);

  return { strategy, legs, transport, lines, perPerson, group: perPerson * state.travellers };
}
