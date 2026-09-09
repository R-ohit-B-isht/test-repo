import { $, html, inr, vnd as dong } from '../../dom.js';
import { icon } from '../../icons.js';
import { rateInfo, fetchLive, SRC, inrToVnd, vndToInr } from '../../fx.js';
import { cashTotals, newCash } from '../../split/cash.js';
import { dailyBudget } from '../../split/daily.js';
import { defaultIso, dayLabel } from '../../split/model.js';
import { TRIP } from '../../data/trip.js';

// Money cards on the Split page (Wise/Revolut): the ₫↔₹ card with a live rate,
// the ATM cash tracker, and the day-by-day spent-vs-planned rings.
// Markup + the store wiring for these three regions only.

const toast = (text, undo) => document.dispatchEvent(new CustomEvent('toast', { detail: { text, undo } }));
const mmdd = (iso) => iso.slice(5).replace('-', '/');

// ── FX card ──────────────────────────────────────────────────────────────────
let fxBusy = false;
let fxError = '';

const FROM_LABEL = { you: 'your rate', live: 'live mid-market', stale: 'live rate, over a week old', sourced: 'sourced when the plan was built' };

export const fxCard = (state) => {
  const r = rateInfo(state);
  const live = state.fxLive;
  return html`
    <article class="card spl-fx" aria-labelledby="fx-title">
      <header class="spl-sum-head">
        <span class="eyebrow" id="fx-title">₫ per ₹</span>
        <b class="num">₫${r.rate}</b>
        <small class="sub"><span class="chip ${r.from === 'live' ? 'chip-jade' : r.from === 'you' ? 'chip-ink' : 'chip-sun'} fx-from">${r.from === 'live' ? icon('check') : ''}${r.label}</span></small>
      </header>
      <p class="sub fx-note">${FROM_LABEL[r.from]}${live ? html` · ${SRC} ${live.iso}` : ''}. Cards and ATMs give a few % less than mid-market.</p>
      <div class="fx-conv" role="group" aria-label="Convert">
        <label class="fld"><span>₫ dong</span><input type="number" inputmode="numeric" name="fx-vnd" min="0" step="1000" placeholder="100000" /></label>
        <span class="fx-eq" aria-hidden="true">=</span>
        <label class="fld"><span>₹ rupees</span><input type="number" inputmode="numeric" name="fx-inr" min="0" step="1" placeholder="${vndToInr(100000, r.rate)}" /></label>
      </div>
      <div class="row">
        <button class="btn btn-sm" type="button" data-fx-refresh ${fxBusy ? 'disabled' : ''}>${icon(fxBusy ? 'clock' : 'undo')}${fxBusy ? 'Fetching…' : live ? 'Refresh live rate' : 'Get live rate'}</button>
        <label class="fld fx-override"><span>Override</span><input type="number" name="rate" inputmode="numeric" min="1" step="1" value="${state.rate > 0 ? state.rate : ''}" placeholder="blank = auto" aria-label="Your own ₫ per ₹" /></label>
      </div>
      ${fxError ? html`<p class="sub fx-err" role="alert">${icon('offline')}${fxError}</p>` : ''}
    </article>`;
};

// ── Cash card ────────────────────────────────────────────────────────────────
export const cashCard = (state) => {
  const t = cashTotals(state);
  const r = rateInfo(state);
  return html`
    <article class="card spl-cash" aria-labelledby="cash-title">
      <header class="spl-sum-head">
        <span class="eyebrow" id="cash-title">Cash pulled</span>
        <b class="num">${t.count ? dong(t.vnd) : '—'}</b>
        ${t.count ? html`<small class="sub num">${inr(t.inr + t.fee)} incl. ${inr(t.fee)} fees · ₫${t.effective} per ₹ effective</small>` : html`<small class="sub">Log each ATM run; the fee is the real cost of cash here.</small>`}
      </header>
      ${t.count ? html`
        <dl class="spl-you cash-you">
          <div><dt>₫ spent (yours)</dt><dd class="num">${dong(t.spentVnd)}</dd></div>
          <div><dt>Left, roughly</dt><dd class="num ${t.left < 0 ? 'is-down' : ''}">${dong(t.left)}</dd></div>
          <div><dt>Runs</dt><dd class="num">${t.count}</dd></div>
        </dl>
        <ul class="cash-list" aria-label="Withdrawals">
          ${t.rows.map((c) => html`<li><span class="num">${mmdd(c.iso)}</span><b class="num">${dong(c.vnd)}</b><span class="sub num">${inr(c.inr)}${c.fee ? ` + ${inr(c.fee)} fee` : ''}${c.atm ? ` · ${c.atm}` : ''}</span><button type="button" class="link" data-cash-del="${c.id}" aria-label="Remove this withdrawal">${icon('x')}</button></li>`)}
        </ul>` : ''}
      <form class="cash-form" id="cash-form" autocomplete="off">
        <label class="fld"><span>₫ out</span><input type="number" name="vnd" inputmode="numeric" min="10000" step="10000" placeholder="2000000" required /></label>
        <label class="fld"><span>₹ charged</span><input type="number" name="inr" inputmode="numeric" min="0" step="1" placeholder="≈ ${vndToInr(2000000, r.rate)}" /></label>
        <label class="fld"><span>ATM fee ₹</span><input type="number" name="fee" inputmode="numeric" min="0" step="1" placeholder="0" /></label>
        <label class="fld"><span>Date</span><input type="date" name="iso" value="${defaultIso()}" required /></label>
        <label class="fld cash-atm"><span>ATM</span><input type="text" name="atm" maxlength="40" placeholder="TPBank, Hoi An" /></label>
        <button class="btn btn-sm" type="submit">${icon('plus')}Log cash</button>
      </form>
    </article>`;
};

// ── Daily rings ──────────────────────────────────────────────────────────────
const R = 15.9155; // circumference 100 → dasharray in percent
const ring = (spent, planned, size = '') => {
  const pct = planned > 0 ? Math.min(100, Math.round((100 * spent) / planned)) : 0;
  const over = planned > 0 && spent > planned;
  return html`
    <svg class="ring ${size} ${over ? 'is-over' : ''}" viewBox="0 0 36 36" role="img" aria-label="${inr(spent)} of ${inr(planned)}">
      <circle class="ring-bg" cx="18" cy="18" r="${R}" />
      <circle class="ring-fg" cx="18" cy="18" r="${R}" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="25" />
      ${size === 'lg' ? html`<text x="18" y="19.5" class="ring-txt">${pct}%</text>` : ''}
    </svg>`;
};

export const dailyCard = (state) => {
  const d = dailyBudget(state);
  if (!d.total) return '';
  const focus = d.today || { n: 0, planned: d.planned, spent: d.total };
  const title = d.today ? `${dayLabel(d.today.iso) || 'Today'} · ${mmdd(d.today.iso)}` : `${TRIP.days} days, on the ground`;
  return html`
    <article class="card spl-daily" aria-labelledby="daily-title">
      <div class="daily-top">
        ${ring(focus.spent, focus.planned, 'lg')}
        <div>
          <span class="eyebrow" id="daily-title">${title}</span>
          <b class="num daily-big">${inr(focus.spent)}</b>
          <small class="sub num">of ${inr(focus.planned)} planned${focus.spent > focus.planned ? html` · <span class="is-down">${inr(focus.spent - focus.planned)} over</span>` : html` · ${inr(focus.planned - focus.spent)} left`}</small>
        </div>
      </div>
      <ol class="daily-strip" aria-label="Day by day">
        ${d.days.map((x) => html`<li class="${x.spent ? '' : 'is-empty'} ${d.today?.n === x.n ? 'is-today' : ''}"><a href="calendar.html#d${x.n}" aria-label="Day ${x.n}: ${inr(x.spent)} of ${inr(x.planned)}">${ring(x.spent, x.planned)}<span>${x.n}</span></a></li>`)}
      </ol>
      <p class="sub daily-note">Planned = beds + food + getting around from your sliders, plus that day's tickets, × ${state.travellers}. Flights and trains left out.</p>
    </article>`;
};

// ── Wiring ───────────────────────────────────────────────────────────────────
export function mountMoney(store) {
  const root = $('#split');
  if (!root) return;

  const refresh = async () => {
    if (fxBusy) return;
    fxBusy = true; fxError = '';
    store.set({});
    try {
      const live = await fetchLive();
      store.set({ fxLive: live });
      toast(`Live rate ₫${live.vndPerInr} per ₹ (${SRC}, ${live.iso})`);
    } catch (e) {
      fxError = navigator.onLine === false ? 'Offline: no live rate, using the last one shown.' : `Could not reach ${SRC} (${e.message}). Rate shown is unchanged.`;
    } finally { fxBusy = false; store.set({}); }
  };

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-fx-refresh]')) return refresh();
    const del = e.target.closest('[data-cash-del]');
    if (del) {
      const id = del.dataset.cashDel;
      const flag = (on) => store.set((s) => ({ cash: s.cash.map((c) => (c.id === id ? { ...c, deleted: on } : c)) }));
      flag(true);
      toast('Withdrawal removed', () => flag(false));
    }
    return undefined;
  });

  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t.name !== 'fx-vnd' && t.name !== 'fx-inr') return;
    const rate = rateInfo(store.get()).rate;
    const other = $(`[name="${t.name === 'fx-vnd' ? 'fx-inr' : 'fx-vnd'}"]`, root);
    const v = Number(t.value);
    other.value = t.value === '' ? '' : t.name === 'fx-vnd' ? vndToInr(v, rate) : inrToVnd(v, rate);
  });

  root.addEventListener('submit', (e) => {
    const f = e.target.closest('#cash-form');
    if (!f) return;
    e.preventDefault();
    const fd = new FormData(f);
    const vnd = Number(fd.get('vnd'));
    if (!(vnd >= 10000)) return;
    const rate = rateInfo(store.get()).rate;
    const inrTyped = Number(fd.get('inr'));
    const rec = newCash({ iso: fd.get('iso') || defaultIso(), vnd, inr: inrTyped > 0 ? inrTyped : vndToInr(vnd, rate), fee: Number(fd.get('fee')) || 0, atm: fd.get('atm') });
    store.set((s) => ({ cash: [...(s.cash || []), rec] }));
    toast(`Logged ${dong(vnd)} cash`);
  });

  // First visit online with no live table yet: fetch once, quietly.
  const s = store.get();
  if (!s.fxLive && navigator.onLine !== false) refresh();
}
