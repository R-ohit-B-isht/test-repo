// Section 03: controls, stacked cost bar, bucket rows, essential / all-in totals.
import { computeBudget, fmt } from '../budget.js';
import { html, raw, $, $$ } from '../dom.js';
import { icon } from '../icons.js';
import { animateNumber } from '../chrome/counter.js';

export function mountBudget(store) {
  $$('.stepper__btn').forEach((btn) => btn.addEventListener('click', () => {
    store.set((s) => ({ travellers: Math.min(6, Math.max(1, s.travellers + Number(btn.dataset.step))) }));
  }));
  $('#homestay-rate').addEventListener('input', (e) => store.set({ homestayRate: Number(e.target.value) }));
}

function stack(b) {
  const total = b.perPerson || 1;
  return b.buckets.map((k) => html`<i class="stack__seg" data-bucket="${k.id}" style="flex-grow:${k.amount / total}" title="${k.label} ${fmt(k.amount)}"></i>`).join('');
}

function rows(b) {
  return b.buckets.map((k) => html`
    <div class="ledger__row ${k.essential ? '' : 'is-extra'}" data-bucket="${k.id}">
      <dt>${raw(icon(k.icon))}<span>${k.label}</span></dt>
      <dd>${fmt(k.amount)}</dd>
    </div>`).join('');
}

let prevTotal = null;

export function renderBudget(state) {
  const b = computeBudget(state);
  $('#travellers').textContent = state.travellers;
  $('#homestay-rate').value = state.homestayRate;
  $('#homestay-rate-out').textContent = `${fmt(state.homestayRate)} / room / night`;
  const paid = b.plan.days.reduce((n, d) => n + d.picks.filter((p) => p.key).length, 0);
  $('#picks-summary').innerHTML = html`<strong>${b.plan.placedCount}</strong> things on the plan · ${paid} paid${b.unpriced.length ? raw(html` · <em>${b.unpriced.length} priced locally, not counted</em>`) : ''} · <a href="#picks">change picks ↑</a>`;

  const onlyEssentials = b.extras === 0;
  $('#ledger').innerHTML = html`
    <div class="stack" role="img" aria-label="${b.buckets.map((k) => `${k.label} ${fmt(k.amount)}`).join(', ')}">${raw(stack(b))}</div>
    <dl class="ledger__list">
      ${raw(rows(b))}
      <div class="ledger__total ${onlyEssentials ? 'is-final' : ''}">
        <dt>Essentials, per person</dt>
        <dd ${onlyEssentials ? 'data-total' : ''}>${fmt(b.essentials)}</dd>
      </div>
      ${onlyEssentials ? '' : raw(html`
      <div class="ledger__total is-final">
        <dt>With your picks</dt>
        <dd data-total>${fmt(b.perPerson)}</dd>
      </div>`)}
      <div class="ledger__group">
        <dt>${state.travellers === 1 ? 'Travelling solo' : `Group of ${state.travellers}`}</dt>
        <dd>${fmt(b.group)}</dd>
      </div>
    </dl>
    <p class="ledger__note">${b.strategy.name} · ${b.plan.length} days · rooms and boats split across the party · three meals a day unless the fare includes them · paid picks ${onlyEssentials ? 'none' : 'included above'}.</p>`;

  const dd = $('[data-total]');
  dd.dataset.prev = String(prevTotal ?? b.perPerson);
  animateNumber(dd, b.perPerson, fmt);
  prevTotal = b.perPerson;
}
