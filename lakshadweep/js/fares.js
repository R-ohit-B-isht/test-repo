// Resolves a PRICES id + user state into the fare actually charged: ship class,
// train class and the homestay slider all live here so budget, route strip and
// day cards agree on one number.
import { PRICES } from './data/prices.js';

const ROOM_KEYS = new Set(['homestayAgattiRoom', 'homestayKavarattiRoom']);
const TRAIN_BY_CLASS = { sleeper: 'trainSleeper', '3a': 'train3A' };

export function fareFor(key, state) {
  const base = PRICES[key];
  if (ROOM_KEYS.has(key)) return { ...base, amount: state.homestayRate };
  if (base.fares) return { ...base, amount: base.fares[state.shipClass] ?? base.amount };
  if (key === 'trainSleeper') return PRICES[TRAIN_BY_CLASS[state.trainClass] || 'trainSleeper'];
  return base;
}

export function fareAmount(key, state) {
  return fareFor(key, state).amount;
}
