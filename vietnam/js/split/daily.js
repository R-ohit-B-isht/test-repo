import { TRIP, isoOf } from '../data/trip.js';
import { computeBudget } from '../budget.js';
import { activityInr, lookup } from '../data/activities.js';
import { liveExpenses } from './model.js';
import { today } from '../clock.js';

// Spent vs planned, per trip day (Revolut's budget ring). Planned is the
// group's on-the-ground money for that day: stay + food + getting-around from
// the sliders, plus tickets the packer placed on that day. Flights, trains and
// the e-visa are pre-trip and left out on both sides ('fly' rows excluded).

const ON_GROUND = (x) => x.kind === 'spend' && x.cat !== 'fly';

export function dailyBudget(state) {
  const b = computeBudget(state);
  const n = state.travellers;
  const stayPerDay = (b.strategy.paidNights * state.bed) / TRIP.days;
  const base = Math.round((stayPerDay + state.food + state.local) * n);
  const tickets = Array.from({ length: TRIP.days }, () => 0);
  const dayOfId = (id) => b.plan.placed.get(id) ?? b.plan.seen.get(id) ?? null;
  b.plan.paid.forEach((x) => {
    const d = dayOfId(x.id);
    if (d) tickets[d - 1] += (activityInr(lookup(state, x.id) || x, n) || 0) * n;
  });
  const spent = Array.from({ length: TRIP.days }, () => 0);
  const byIso = Object.fromEntries(Array.from({ length: TRIP.days }, (_, i) => [isoOf(i + 1), i]));
  liveExpenses(state).filter(ON_GROUND).forEach((x) => { if (x.iso in byIso) spent[byIso[x.iso]] += x.inr; });
  const days = tickets.map((t, i) => ({ n: i + 1, iso: isoOf(i + 1), planned: base + t, spent: spent[i] }));
  const planned = days.reduce((s, d) => s + d.planned, 0);
  const total = days.reduce((s, d) => s + d.spent, 0);
  const now = today();
  const cur = days.find((d) => d.iso === now) || null;
  return { days, planned, total, base, today: cur };
}
