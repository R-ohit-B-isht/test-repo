import { ACTIVITIES, TRIP } from '../data/trip.js';
import { PRICES } from '../data/prices.js';
import { computeBudget, fmt } from '../budget.js';
import { html, raw, $, $$ } from '../dom.js';
import { animateNumber } from '../chrome/counter.js';

export function mountBudget(store) {
  $$('.stepper__btn').forEach((btn) => btn.addEventListener('click', () => {
    store.set((s) => ({ travellers: Math.min(6, Math.max(1, s.travellers + Number(btn.dataset.step))) }));
  }));
  $('#homestay-rate').addEventListener('input', (e) => store.set({ homestayRate: Number(e.target.value) }));

  $('#activity-toggles').innerHTML = ACTIVITIES.map((a) => html`
    <button type="button" class="toggle" data-activity="${a.id}" aria-pressed="true">
      <span>${a.label}</span>
      <span class="toggle__price">${fmt(PRICES[a.key].amount)}</span>
    </button>`).join('');
  $('#activity-toggles').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-activity]');
    if (!btn) return;
    store.set((s) => ({ activities: { ...s.activities, [btn.dataset.activity]: !s.activities[btn.dataset.activity] } }));
  });
}

function ledgerLines(b) {
  return b.lines.map((l) => html`<div class="ledger__line"><dt>${l.label}</dt><dd>${fmt(l.amount)}</dd></div>`).join('');
}

let prevTotal = null;

export function renderBudget(state) {
  const b = computeBudget(state);
  $('#travellers').textContent = state.travellers;
  $('#homestay-rate').value = state.homestayRate;
  $('#homestay-rate-out').textContent = `${fmt(state.homestayRate)} / room / night`;
  $$('[data-activity]').forEach((btn) => btn.setAttribute('aria-pressed', String(Boolean(state.activities[btn.dataset.activity]))));

  const quote = TRIP.quotedRoundTrip;
  const pct = Math.min(100, (b.perPerson / quote) * 100);
  const under = quote - b.perPerson;
  $('#ledger').innerHTML = html`
    <dl>
      ${raw(ledgerLines(b))}
      <div class="ledger__total">
        <dt>Per person, all in</dt>
        <dd data-total>${fmt(b.perPerson)}<small>${fmt(b.group)} for ${state.travellers} · ${b.strategy.name}</small></dd>
      </div>
      <div class="ledger__vs">
        <dt class="label">Against the ${fmt(quote)} flight-only quote</dt>
        <div class="bar" role="img" aria-label="Trip total is ${Math.round(pct)}% of the quoted round-trip fare"><span style="width:${pct}%"></span><i class="bar__mark" style="left:100%"></i></div>
        <div class="bar__labels"><span>₹0</span><span class="is-quote">${fmt(quote)} quote</span></div>
        <dd>${under >= 0
          ? `Ten days, four islands, everything included, and still ${fmt(under)} under what one return flight was going to cost.`
          : `With these options the trip runs ${fmt(-under)} over the flight-only quote — drop an activity or take second class.`}</dd>
      </div>
    </dl>`;

  const dd = $('[data-total]');
  dd.dataset.prev = String(prevTotal ?? b.perPerson);
  animateNumber(dd, b.perPerson, fmt);
  prevTotal = b.perPerson;
}
