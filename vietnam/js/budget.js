import { PRICES } from './data/prices.js';
import { TRIP } from './data/trip.js';
import { findStrategy, transportTotal } from './strategies.js';
import { planTrip } from './plan.js';

// Pure arithmetic. Per person, rupees. No DOM.

const perPerson = (price, travellers) => (price.perGroup ? Math.ceil(price.amount / travellers) : price.amount);

export function computeBudget(state) {
  const strategy = findStrategy(state.strategy);
  const legs = strategy.legs(PRICES, state);
  const flights = legs.filter((l) => l.mode === 'plane').reduce((s, l) => s + perPerson(l.price, state.travellers), 0);
  const ground = transportTotal(strategy, PRICES, state) - flights;

  const stay = strategy.paidNights * state.bed;
  const food = TRIP.days * state.food;
  const local = TRIP.days * state.local;
  const plan = planTrip(state, strategy.transit);
  const activities = plan.cost;
  const admin = PRICES.evisa.amount + PRICES.sim.amount;

  const subtotal = flights + ground + stay + food + local + activities + admin;
  const buffer = Math.round(subtotal * (state.buffer / 100));
  const total = subtotal + buffer;

  return {
    strategy,
    legs,
    plan,
    lines: [
      { id: 'flights', label: 'Flights', amount: flights, icon: 'plane' },
      { id: 'ground', label: 'Trains · buses', amount: ground, icon: 'train' },
      { id: 'stay', label: `${strategy.paidNights} nights`, amount: stay, icon: 'bed' },
      { id: 'food', label: 'Food', amount: food, icon: 'bowl' },
      { id: 'activities', label: `Days out · ${plan.paid.length} tickets`, amount: activities, icon: 'ticket' },
      { id: 'local', label: 'Getting around', amount: local, icon: 'moto' },
      { id: 'admin', label: 'e-visa · SIM', amount: admin, icon: 'passport' },
      { id: 'buffer', label: `${state.buffer}% buffer`, amount: buffer, icon: 'shield' },
    ],
    subtotal,
    total,
    group: total * state.travellers,
    vsQuote: TRIP.quotedRoundTrip - flights,
  };
}

// Same arithmetic for every strategy, so the picker can show real deltas.
export const compareStrategies = (state, ids) => ids.map((id) => ({ id, ...computeBudget({ ...state, strategy: id }) }));
