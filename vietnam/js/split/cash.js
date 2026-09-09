import { liveExpenses, newId } from './model.js';
import { SPLIT_MAX_INR } from '../config.js';

// Cash tracker (Wise/Revolut's cash tab): every ₫ you pull from an ATM, with
// the rupee it cost you and the fee. Records, never deleted: `deleted` flags.
//   state.cash = [{ id, iso, vnd, inr, fee, atm, created, deleted }]
// `inr` is what your bank charged for the ₫ (statement figure, if you have it,
// else ₫ ÷ the rate that day); `fee` is the ATM's own surcharge in rupees.

export const liveCash = (state) => (state.cash || []).filter((c) => !c.deleted).sort((a, b) => b.iso.localeCompare(a.iso) || (b.created || 0) - (a.created || 0));

export const newCash = ({ iso, vnd, inr, fee = 0, atm = '' }) => ({
  id: newId('c'), iso, vnd: Math.round(vnd), inr: Math.min(SPLIT_MAX_INR, Math.round(inr)), fee: Math.min(SPLIT_MAX_INR, Math.round(fee) || 0), atm: String(atm || '').trim().slice(0, 40), created: Date.now(),
});

// Wallet maths: ₫ pulled, what it cost, fees, and the ₫ you have already logged
// as cash spends (₫ rows you paid). "Left" is only as good as your logging.
export function cashTotals(state) {
  const rows = liveCash(state);
  const vnd = rows.reduce((n, c) => n + c.vnd, 0);
  const inr = rows.reduce((n, c) => n + c.inr, 0);
  const fee = rows.reduce((n, c) => n + c.fee, 0);
  const spentVnd = liveExpenses(state)
    .filter((x) => x.kind === 'spend' && x.cur === 'VND' && x.by === state.me)
    .reduce((n, x) => n + x.amount, 0);
  const effective = vnd > 0 ? Math.round(vnd / Math.max(1, inr + fee)) : 0;
  return { rows, count: rows.length, vnd, inr, fee, spentVnd, left: vnd - spentVnd, effective };
}
