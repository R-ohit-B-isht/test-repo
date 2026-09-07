// Section 03: controls, stacked cost bar, bucket rows, essential / all-in totals.
import { ACTIVITIES } from '../data/trip.js';
import { PRICES } from '../data/prices.js';
import { computeBudget, fmt } from '../budget.js';
import { html, raw, $, $$ } from '../dom.js';
import { icon } from '../icons.js';
import { animateNumber } from '../chrome/counter.js';

export function mountBudget(store) {
  $$('.stepper__btn').forEach((btn) => btn.addEventListener('click', () => {
    store.set((s) => ({ travellers: Math.min(6, Math.max(1, s.travellers + Number(btn.dataset.step))) }));
  }));
  $('#homestay-rate').addEventListener('input', (e) => store.set({ homestayRate: Number(e.target.value) }));

  $('#activity-toggles').innerHTML = ACTIVITIES.map((a) => html`
    <button type="button" class="toggle" data-activity="${a.id}" aria-pressed="false">
      ${raw(icon(a.icon))}
      <span class="toggle__name">${a.label}<small>${a.where}</small></span>
      <span class="toggle__price">${fmt(PRICES[a.key].amount)}</span>
    </button>`).join('');
  $('#activity-toggles').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-activity]');
    if (!btn) return;
    store.set((s) => ({ activities: { ...s.activities, [btn.dataset.activity]: !s.activities[btn.dataset.activity] } }));
  });
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
  const onRoute = new Set(b.plan.days.flatMap((d) => d.spend.filter((i) => i.optional).map((i) => i.optional)));
  $$('[data-activity]').forEach((btn) => {
    const here = onRoute.has(btn.dataset.activity);
    btn.disabled = !here;
    btn.title = here ? '' : 'Not on this route';
    btn.setAttribute('aria-pressed', String(here && Boolean(state.activities[btn.dataset.activity])));
  });

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
        <dt>With water sports</dt>
        <dd data-total>${fmt(b.perPerson)}</dd>
      </div>`)}
      <div class="ledger__group">
        <dt>${state.travellers === 1 ? 'Travelling solo' : `Group of ${state.travellers}`}</dt>
        <dd>${fmt(b.group)}</dd>
      </div>
    </dl>
    <p class="ledger__note">${b.strategy.name} · ${b.plan.length} days · rooms and boats split across the party · optional sports ${onlyEssentials ? 'switched off' : 'included above'}.</p>`;

  const dd = $('[data-total]');
  dd.dataset.prev = String(prevTotal ?? b.perPerson);
  animateNumber(dd, b.perPerson, fmt);
  prevTotal = b.perPerson;
}
