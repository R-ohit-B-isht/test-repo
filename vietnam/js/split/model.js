import { TRIP } from '../data/trip.js';
import { SPLIT_MAX_INR } from '../config.js';
import { dayOf } from '../export/dates.js';
import { rateInfo } from '../fx.js';
import { today } from '../clock.js';

// Split ledger model. People and expenses live in state (localStorage) next to
// the rest of the plan; a receipt photo, if any, is a Manager-style file meta
// whose bytes sit in IndexedDB. Money is whole rupees; a ₫ entry keeps the ₫
// figure you typed and the rupee value it converted to at the time.
//
//   person  { id, name, hue, me, deleted }
//   expense { id, kind: 'spend' | 'settle', iso, title, cat, amount, cur, inr,
//             by, split: { mode: 'equal' | 'exact' | 'shares', parts: { pid: n } },
//             to (settle only), note, receipt, created, updated, deleted }

export const CATS = [
  { id: 'food', label: 'Food', icon: 'bowl' },
  { id: 'stay', label: 'Stay', icon: 'bed' },
  { id: 'ride', label: 'Ride', icon: 'moto' },
  { id: 'fun', label: 'Tickets', icon: 'ticket' },
  { id: 'night', label: 'Nights', icon: 'beer' },
  { id: 'shop', label: 'Shopping', icon: 'lantern' },
  { id: 'fly', label: 'Flights', icon: 'plane' },
  { id: 'other', label: 'Other', icon: 'wallet' },
];
export const catOf = (id) => CATS.find((c) => c.id === id) || CATS[CATS.length - 1];

export const MODES = { equal: 'Equally', exact: 'Exact ₹', shares: 'Shares' };

export const HUES = [14, 36, 92, 160, 200, 230, 276, 320];

export const livePeople = (state) => state.people.filter((p) => !p.deleted);
export const liveExpenses = (state) => state.expenses.filter((x) => !x.deleted);
export const personOf = (state, id) => state.people.find((p) => p.id === id) || null;
export const nameOf = (state, id) => (id === state.me ? 'You' : personOf(state, id)?.name || 'Someone');
export const me = (state) => personOf(state, state.me);

export const rateOf = (state) => rateInfo(state).rate;
export const toInr = (amount, cur, state) => (cur === 'VND' ? Math.round(amount / rateOf(state)) : Math.round(amount));

export const newId = (p) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const nextHue = (state) => HUES[livePeople(state).length % HUES.length];

// Who owes what on one expense, in whole rupees, summing to `inr` exactly:
// the leftover paise go to the first participants so nothing is lost.
export function sharesOf(x) {
  const ids = Object.keys(x.split.parts);
  if (!ids.length) return {};
  if (x.split.mode === 'exact') {
    const sum = ids.reduce((n, id) => n + (x.split.parts[id] || 0), 0);
    if (sum <= 0) return Object.fromEntries(ids.map((id) => [id, 0]));
    return scale(ids, x.split.parts, sum, x.inr);
  }
  const weights = x.split.mode === 'shares' ? x.split.parts : Object.fromEntries(ids.map((id) => [id, 1]));
  const total = ids.reduce((n, id) => n + (weights[id] || 0), 0);
  return total > 0 ? scale(ids, weights, total, x.inr) : Object.fromEntries(ids.map((id) => [id, 0]));
}

const scale = (ids, weights, total, inr) => {
  const out = {};
  let left = inr;
  ids.forEach((id) => { out[id] = Math.floor((inr * (weights[id] || 0)) / total); left -= out[id]; });
  for (let i = 0; left > 0; i = (i + 1) % ids.length) { if ((weights[ids[i]] || 0) > 0) { out[ids[i]] += 1; left -= 1; } }
  return out;
};

// Your line on a row: + you are owed, − you owe, 0 not involved / even.
export const myLine = (state, x) => {
  if (!state.me) return 0;
  if (x.kind === 'settle') return x.by === state.me ? x.inr : x.to === state.me ? -x.inr : 0;
  const s = sharesOf(x);
  const paid = x.by === state.me ? x.inr : 0;
  return paid - (s[state.me] || 0);
};

// Label for a date in the ledger: trip days get their number.
export const dayLabel = (iso) => {
  const n = dayOf(iso);
  if (n === 0) return 'Fly-out night';
  return n ? `Day ${n}` : null;
};

export const clampInr = (n) => Math.max(0, Math.min(SPLIT_MAX_INR, Math.round(Number(n) || 0)));

export const defaultIso = () => {
  const now = today();
  return now >= TRIP.start ? now : TRIP.start;
};
