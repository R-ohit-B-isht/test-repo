// Pure budget arithmetic. Input: state. Output: per-person buckets and totals.
// Items come from plan.js (`day.items`): ticket spend, the night's bed, the
// day's paid meals and any picked experiences that cost money.
import { PRICES } from './data/prices.js';
import { STRATEGIES } from './strategies.js';
import { buildPlan } from './plan.js';
import { fareAmount } from './fares.js';

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export const fmt = (n) => `₹${inr.format(Math.round(n))}`;
export const fmtK = (n) => `₹${(Math.round(n / 100) / 10).toFixed(1)}k`;

const STAY_KEYS = new Set(['homestayAgattiRoom', 'homestayKavarattiRoom', 'hostelKochi']);

// Buckets in display order. `essential` buckets make up the headline number.
export const BUCKETS = [
  { id: 'transport', label: 'Getting there & back', icon: 'plane', essential: true },
  { id: 'package', label: 'Cruise package', icon: 'ship', essential: true },
  { id: 'stay', label: 'Beds', icon: 'home', essential: true },
  { id: 'food', label: 'Meals, 3 a day', icon: 'meal', essential: true },
  { id: 'local', label: 'Buses & permit', icon: 'permit', essential: true },
  { id: 'extras', label: 'Boats & water sports', icon: 'snorkel', essential: false },
];

// Per-person cost of one spend item for the given party.
export function itemCost(item, state) {
  const n = Math.max(1, state.travellers);
  const amount = fareAmount(item.key, state) * (item.qty || 1);
  if (item.perRoom) return (Math.ceil(n / 2) * amount) / n;
  return amount;
}

export function bucketOf(item) {
  if (item.transport) return 'transport';
  if (item.package) return 'package';
  if (item.pick) return 'extras';
  if (STAY_KEYS.has(item.key)) return 'stay';
  if (item.key === 'meal') return 'food';
  return 'local';
}

export function dayTotal(day, state) {
  return day.items.reduce((s, i) => s + itemCost(i, state), 0);
}

export function dayGroundCost(day, state) {
  return day.items.filter((i) => !i.transport && !i.package).reduce((s, i) => s + itemCost(i, state), 0);
}

// Picked items whose price has no published figure (charged locally).
export function unpriced(plan) {
  return plan.days.flatMap((d) => d.items.filter((i) => i.pick && PRICES[i.key].status === 'unavailable'));
}

export function computeBudget(state) {
  const plan = buildPlan(state);
  const sums = Object.fromEntries(BUCKETS.map((b) => [b.id, 0]));
  for (const day of plan.days) for (const item of day.items) sums[bucketOf(item)] += itemCost(item, state);
  sums.local += PRICES.permit.amount;

  const buckets = BUCKETS.map((b) => ({ ...b, amount: sums[b.id] })).filter((b) => b.amount > 0);
  const essentials = buckets.filter((b) => b.essential).reduce((s, b) => s + b.amount, 0);
  const extras = sums.extras;
  const perPerson = essentials + extras;
  return {
    plan,
    strategy: plan.strategy,
    legs: plan.legs,
    buckets,
    transport: sums.transport + sums.package,
    package: sums.package,
    stay: sums.stay,
    food: sums.food,
    local: sums.local,
    extras,
    essentials,
    perPerson,
    group: perPerson * state.travellers,
    unpriced: unpriced(plan),
    accommodation: sums.stay,
    optionalActivities: extras,
    essentialSubtotal: essentials,
    allInSubtotal: perPerson,
  };
}

// One line per strategy, same party/options, for the comparison chart.
export function compareStrategies(state) {
  return STRATEGIES.map((s) => {
    const b = computeBudget({ ...state, strategy: s.id });
    return { strategy: s, transport: b.transport, essentials: b.essentials, perPerson: b.perPerson, plan: b.plan };
  });
}

export function cheapest(rows, key = 'essentials') {
  return rows.reduce((min, r) => (r[key] < min[key] ? r : min), rows[0]);
}
