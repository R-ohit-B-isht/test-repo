import { $, $$, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { computeBudget } from '../budget.js';
import { PRICES } from '../data/prices.js';
import { TRIP } from '../data/trip.js';
import { srcPill } from './route.js';
import { activityInr } from '../data/activities.js';

// Budget: sliders for the four things you control, the tickets your picks add
// up to, and a ledger with dotted leaders + a stacked bar. Sliders are built once.

const SLIDERS = [
  { id: 'bed', label: 'Bed / night', icon: 'bed', min: 400, max: 3000, step: 50, hint: (v) => (v < 900 ? 'dorm bed' : v < 1800 ? 'private room, shared' : 'private ensuite'), src: PRICES.bed },
  { id: 'food', label: 'Food / day', icon: 'bowl', min: 500, max: 2500, step: 50, hint: (v) => (v < 900 ? 'street food only' : v < 1600 ? 'street + local restaurants' : 'restaurants, drinks'), src: PRICES.food },
  { id: 'local', label: 'Getting around / day', icon: 'moto', min: 100, max: 1000, step: 50, hint: (v) => (v < 250 ? 'walk + one GrabBike' : v < 600 ? '2–3 GrabBike hops' : 'GrabCar most hops'), src: PRICES.local },
  { id: 'buffer', label: 'Buffer', icon: 'shield', min: 0, max: 25, step: 5, unit: '%', hint: (v) => (v < 10 ? 'tight' : v <= 15 ? 'sensible' : 'relaxed') },
];

const COLORS = { flights: 'var(--lantern)', ground: 'var(--indigo)', stay: 'var(--jade)', food: 'var(--sun)', activities: 'var(--rain)', local: 'var(--fg-3)', admin: 'var(--line)', buffer: 'var(--bg-2)' };

const sliderRow = (s) => html`
  <div class="slider">
    <label for="sl-${s.id}">${icon(s.icon)} ${s.label} ${s.src ? srcPill(s.src) : ''}</label>
    <output class="num" for="sl-${s.id}" data-out="${s.id}"></output>
    <input id="sl-${s.id}" type="range" name="${s.id}" min="${s.min}" max="${s.max}" step="${s.step}" />
    <span class="hint" data-hint="${s.id}"></span>
  </div>`;

const ticketLine = (x, plan, travellers) => html`
  <div class="ledger-line">
    <span class="lbl">${icon(x.icon)} ${x.name} <span class="chip chip-ink num">D${plan.placed.get(x.id)}</span></span><span class="lead"></span><span class="amt num">${inr(activityInr(x, travellers))}</span>
  </div>`;

const ticketsCard = (b, state) => html`
  <div class="card"><span class="eyebrow">Days out · from your picks</span>
    <div class="ledger" style="margin-top:16px">
      ${b.plan.paid.length ? b.plan.paid.map((x) => ticketLine(x, b.plan, state.travellers)) : html`<span class="muted small">Nothing ticketed yet — everything on the cards is free.</span>`}
    </div>
    <a class="btn-link" href="#picker">${icon('sparkle')} Change picks</a>
  </div>`;

export function mountBudget(store) {
  $('#controls').innerHTML = html`
    <div class="card"><span class="eyebrow">Comfort dials</span><div class="ledger" style="margin-top:16px">${SLIDERS.map(sliderRow)}</div></div>
    <div id="tickets"></div>`;
  $('#controls').addEventListener('input', (e) => { if (e.target.type === 'range') store.set({ [e.target.name]: Number(e.target.value) }); });
  $('#travellers-seg').innerHTML = html`<div class="seg" role="radiogroup" aria-label="Travellers">${[1, 2, 3, 4].map((n) => html`<label><input type="radio" name="travellers" value="${n}" aria-label="${n} ${n === 1 ? 'traveller' : 'travellers'}" /><span>${icon('users')} ${n}</span></label>`)}</div>`;
  $('#travellers-seg').addEventListener('change', (e) => { if (e.target.name === 'travellers') store.set({ travellers: Number(e.target.value) }); });
}

const ledgerLine = (l) => html`
  <div class="ledger-line">
    <span class="lbl">${icon(l.icon)} ${l.label}</span><span class="lead"></span><span class="amt num">${inr(l.amount)}</span>
  </div>`;

export function renderBudget(state) {
  const b = computeBudget(state);
  SLIDERS.forEach((s) => {
    const v = state[s.id];
    $(`#sl-${s.id}`).value = v;
    $(`[data-out="${s.id}"]`).textContent = s.unit ? `${v}${s.unit}` : inr(v);
    $(`[data-hint="${s.id}"]`).textContent = s.hint(v);
  });
  $('#tickets').innerHTML = ticketsCard(b, state);
  $$('input[name="travellers"]').forEach((el) => { el.checked = Number(el.value) === state.travellers; });

  $('#ledger').innerHTML = html`
    <span class="eyebrow">Per person · ${b.strategy.name}</span>
    <div class="big num" style="margin-top:8px">${inr(b.total)}</div>
    <div class="stack" style="margin-top:16px" role="img" aria-label="Cost split: flights ${Math.round((b.lines[0].amount / b.total) * 100)} percent">
      ${b.lines.map((l) => html`<span style="flex-grow:${l.amount};background:${COLORS[l.id]}" title="${l.label} ${inr(l.amount)}"></span>`)}
    </div>
    <div class="stack-key">${b.lines.slice(0, 5).map((l) => html`<span><i style="background:${COLORS[l.id]}"></i>${l.label}</span>`)}</div>
    <div class="ledger" style="margin-top:24px">
      ${b.lines.map(ledgerLine)}
      <div class="ledger-line ledger-total"><span class="lbl">${TRIP.days} days, all in</span><span class="lead"></span><span class="amt num">${inr(b.total)}</span></div>
    </div>
    <div class="grp"><span>${state.travellers} ${state.travellers === 1 ? 'traveller' : 'travellers'}</span><b class="num">${inr(b.group)}</b></div>
    <p class="small muted" style="margin-top:16px">Flights: ${TRIP.observedWindow}, one adult, taxes and fees in, 7 kg cabin bag only. Fares move daily; not live seats.</p>`;
}
