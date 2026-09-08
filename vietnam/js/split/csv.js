import { TRIP } from '../data/trip.js';
import { livePeople, liveExpenses, sharesOf, catOf, personOf } from './model.js';

// Ledger as CSV, one row per expense with a share column per person — the
// shape Splitwise's own export uses, so it drops into Sheets as-is.

const cell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export function buildCSV(state) {
  const people = livePeople(state);
  const head = ['Date', 'Description', 'Category', 'Cost (INR)', 'Currency', 'Amount typed', 'Paid by', ...people.map((p) => p.name), 'Note'];
  const rows = [...liveExpenses(state)].sort((a, b) => a.iso.localeCompare(b.iso) || (a.created || 0) - (b.created || 0)).map((x) => {
    const s = x.kind === 'settle' ? {} : sharesOf(x);
    return [
      x.iso, x.kind === 'settle' ? `Settle up → ${personOf(state, x.to)?.name || ''}` : x.title, x.kind === 'settle' ? 'Payment' : catOf(x.cat).label,
      x.inr, x.cur, x.amount, personOf(state, x.by)?.name || '',
      ...people.map((p) => (x.kind === 'settle' ? (p.id === x.by ? x.inr : p.id === x.to ? -x.inr : 0) : (p.id === x.by ? x.inr : 0) - (s[p.id] || 0))),
      x.note || '',
    ];
  });
  return [head, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

export const CSV_NAME = `vietnam-split-${TRIP.start}.csv`;
