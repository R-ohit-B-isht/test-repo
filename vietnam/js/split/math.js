import { livePeople, liveExpenses, sharesOf } from './model.js';

// Balances and totals over the live ledger. Pure functions of state.

// Net position per person: > 0 is owed money, < 0 owes. Settlements move
// money from `by` to `to`, so they cancel a debt instead of splitting.
export function balances(state) {
  const net = Object.fromEntries(livePeople(state).map((p) => [p.id, 0]));
  const add = (id, n) => { if (id in net) net[id] += n; };
  liveExpenses(state).forEach((x) => {
    if (x.kind === 'settle') { add(x.by, x.inr); add(x.to, -x.inr); return; }
    add(x.by, x.inr);
    Object.entries(sharesOf(x)).forEach(([id, n]) => add(id, -n));
  });
  return net;
}

// Fewest transfers that clear every balance (greedy max-debtor → max-creditor,
// the same "simplify debts" idea Splitwise uses). Returns [{ from, to, inr }].
export function settleUp(net) {
  const debt = Object.entries(net).filter(([, n]) => n < 0).map(([id, n]) => ({ id, n: -n })).sort((a, b) => b.n - a.n);
  const cred = Object.entries(net).filter(([, n]) => n > 0).map(([id, n]) => ({ id, n })).sort((a, b) => b.n - a.n);
  const out = [];
  let i = 0; let j = 0;
  while (i < debt.length && j < cred.length) {
    const inr = Math.min(debt[i].n, cred[j].n);
    if (inr > 0) out.push({ from: debt[i].id, to: cred[j].id, inr });
    debt[i].n -= inr; cred[j].n -= inr;
    if (debt[i].n === 0) i += 1;
    if (cred[j].n === 0) j += 1;
  }
  return out;
}

export function totals(state) {
  const spends = liveExpenses(state).filter((x) => x.kind === 'spend');
  const total = spends.reduce((n, x) => n + x.inr, 0);
  const paid = {}; const share = {}; const byCat = {}; const byDay = {};
  livePeople(state).forEach((p) => { paid[p.id] = 0; share[p.id] = 0; });
  spends.forEach((x) => {
    if (x.by in paid) paid[x.by] += x.inr;
    Object.entries(sharesOf(x)).forEach(([id, n]) => { if (id in share) share[id] += n; });
    byCat[x.cat] = (byCat[x.cat] || 0) + x.inr;
    byDay[x.iso] = (byDay[x.iso] || 0) + x.inr;
  });
  return { total, count: spends.length, paid, share, byCat, byDay };
}

// Ledger grouped by date, newest date first, newest row first inside a date.
export const byDate = (state) => {
  const groups = new Map();
  [...liveExpenses(state)].sort((a, b) => b.iso.localeCompare(a.iso) || (b.created || 0) - (a.created || 0)).forEach((x) => {
    if (!groups.has(x.iso)) groups.set(x.iso, []);
    groups.get(x.iso).push(x);
  });
  return [...groups.entries()].map(([iso, rows]) => ({ iso, rows }));
};

// Recent changes, newest first: what the Splitwise activity tab shows.
export const activity = (state, n = 8) => [...state.expenses]
  .sort((a, b) => (b.updated || b.created || 0) - (a.updated || a.created || 0))
  .slice(0, n);
