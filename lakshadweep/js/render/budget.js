// Section 04: controls (travellers, homestay rate, picks summary) on the left,
// the sticky ledger card (stacked bar, dotted-leader lines, totals) on the right.
import { computeBudget, fmt } from '../budget.js';
import { html, raw, $ } from '../dom.js';
import { icon } from '../icons.js';
import { animateNumber } from '../chrome/counter.js';

export function mountBudget(store) {
  $('#controls').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-step]');
    if (!btn) return;
    store.set((s) => ({ travellers: Math.min(6, Math.max(1, s.travellers + Number(btn.dataset.step))) }));
  });
  $('#homestay-rate').addEventListener('input', (e) => store.set({ homestayRate: Number(e.target.value) }));
}

const seg = (k, total) => html`<i data-bucket="${k.id}" style="flex-grow:${k.amount / total}" title="${k.label} ${fmt(k.amount)}"></i>`;
const key = (k) => html`<span><i data-bucket="${k.id}"></i>${k.label}</span>`;

function line(k) {
  return html`
    <div class="ledger-line ${k.essential ? '' : 'is-extra'}">
      <span class="lbl">${raw(icon(k.icon))}<span>${k.label}</span></span>
      <span class="lead"></span>
      <span class="amt">${fmt(k.amount)}</span>
    </div>`;
}

let prevTotal = null;

export function renderBudget(state) {
  const b = computeBudget(state);
  $('#travellers').textContent = state.travellers;
  $('[data-step="-1"]', $('#controls')).disabled = state.travellers <= 1;
  $('[data-step="1"]', $('#controls')).disabled = state.travellers >= 6;
  $('#homestay-rate').value = state.homestayRate;
  $('#homestay-rate-out').textContent = `${fmt(state.homestayRate)} / room / night`;

  const paid = b.plan.days.reduce((n, d) => n + d.picks.filter((p) => p.key).length, 0);
  $('#picks-summary').innerHTML = html`<strong>${b.plan.placedCount}</strong> on the plan · <strong>${paid}</strong> paid${b.unpriced.length ? raw(html` · <em>${b.unpriced.length} priced locally</em>`) : ''} <a href="#picks">change ↑</a>`;

  const total = b.perPerson || 1;
  const onlyEssentials = b.extras === 0;
  $('#ledger').innerHTML = html`
    <span class="eyebrow">Per person</span>
    <div class="ledger-big"><span class="num" data-total>${fmt(b.perPerson)}</span><small>${b.plan.length} days · ${b.strategy.name}</small></div>
    <div class="stack" role="img" aria-label="${b.buckets.map((k) => `${k.label} ${fmt(k.amount)}`).join(', ')}">${raw(b.buckets.map((k) => seg(k, total)).join(''))}</div>
    <div class="stack-key">${raw(b.buckets.map(key).join(''))}</div>
    <div class="ledger">
      ${raw(b.buckets.map(line).join(''))}
      ${onlyEssentials ? '' : raw(html`
      <div class="ledger-line ledger-sub"><span class="lbl">Essentials only</span><span class="lead"></span><span class="amt">${fmt(b.essentials)}</span></div>`)}
      <div class="ledger-line ledger-total">
        <span class="lbl">${raw(icon('bag'))}<span>${state.travellers === 1 ? 'Solo' : `Group of ${state.travellers}`}</span></span>
        <span class="lead"></span>
        <span class="amt">${fmt(b.group)}</span>
      </div>
    </div>
    <p class="ledger-note">Rooms and boats split across the party · three meals a day unless the fare feeds you · planning estimates, not live fares.</p>`;

  const dd = $('[data-total]', $('#ledger'));
  dd.dataset.prev = String(prevTotal ?? b.perPerson);
  animateNumber(dd, b.perPerson, fmt);
  prevTotal = b.perPerson;
}
