import { $, $$, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { STRATEGIES, REJECTED } from '../strategies.js';
import { compareStrategies } from '../budget.js';
import { PRICES, KIND_LABEL, CHECKED } from '../data/prices.js';
import { SOURCES } from '../data/sources.js';
import { renderMap, mountMap } from './map.js';

// Route picker: every strategy is the same card shape (Citymapper), so the eye
// compares price, modes and one line of "why". Legs list = the selected ticket.
// Cards are built once; only numbers and checked state update, so keyboard focus survives.

const perPerson = (price, n) => (price.perGroup ? Math.ceil(price.amount / n) : price.amount);

export const srcPill = (price) => {
  const s = SOURCES[price.source];
  return html`<a class="src" href="${s.url}" target="_blank" rel="noopener" title="${s.name}: ${price.range}">${KIND_LABEL[price.kind]} ${icon('link')}</a>`;
};

const modeChips = (legs) => html`<div class="mode-chips">${legs.map((l, i) => html`${i ? html`<span class="sep"></span>` : ''}<span title="${l.from} → ${l.to}">${icon(l.mode)}</span>`)}</div>`;

const badgeClass = (tag) => (tag === 'Recommended' ? 'chip-jade' : tag === 'Cheapest' ? 'chip-lantern' : '');

const card = (s, legs) => html`
  <label class="route-card">
    <input type="radio" name="strategy" value="${s.id}" />
    <div class="card">
      <div class="route-head">
        <span class="radio" aria-hidden="true"></span>
        <div style="flex:1;min-width:0">
          <span class="badge ${badgeClass(s.tag)}">${s.tag}</span>
          <h3 style="margin-top:6px">${s.name}</h3>
        </div>
        <div class="price"><b class="num" data-total></b><span class="delta num" data-delta></span></div>
      </div>
      ${modeChips(legs)}
      <p class="why">${s.why}</p>
    </div>
  </label>`;

const legRow = (l, n) => html`
  <div class="leg">
    ${icon(l.mode)}
    <div><div class="where">${l.from} → ${l.to}</div><div class="note">${l.note}</div></div>
    <div class="amt num">${inr(perPerson(l.price, n))}${srcPill(l.price)}</div>
  </div>`;

const rejectedRow = (r, state) => {
  const legs = r.legs(PRICES, state);
  const total = legs.reduce((s, l) => s + perPerson(l.price, state.travellers), 0);
  return html`<div class="row"><div><b>${r.name}</b> ${modeChips(legs)}</div><b class="num">${inr(total)} flights</b><p>${r.verdict}</p></div>`;
};

export function mountRoute(store) {
  const state = store.get();
  $('#routes').innerHTML = STRATEGIES.map((s) => card(s, s.legs(PRICES, state))).join('');
  $('#routes').addEventListener('change', (e) => { if (e.target.name === 'strategy') store.set({ strategy: e.target.value }); });
  $('#berth-seg').addEventListener('change', (e) => { if (e.target.name === 'berth') store.set({ berth: e.target.value }); });
  mountMap();
}

const renderBerth = (state, show) => {
  const seg = $('#berth-seg');
  if (!show) { seg.innerHTML = ''; return; }
  if (!seg.firstElementChild) {
    seg.innerHTML = html`<div class="seg" role="radiogroup" aria-label="Sleeper berth">
      ${['6', '4'].map((b) => html`<label><input type="radio" name="berth" value="${b}" /><span>${icon('bed')} ${b}-berth · ${inr(b === '4' ? PRICES.train4.amount : PRICES.train6.amount)}</span></label>`)}
    </div>`;
  }
  $$('input[name="berth"]', seg).forEach((el) => { el.checked = el.value === state.berth; });
};

export function renderRoute(state) {
  const results = compareStrategies(state, STRATEGIES.map((s) => s.id));
  const cheapest = Math.min(...results.map((r) => r.total));
  $$('.route-card', $('#routes')).forEach((el, i) => {
    const r = results[i]; const delta = r.total - cheapest;
    el.querySelector('input').checked = r.id === state.strategy;
    el.querySelector('[data-total]').textContent = inr(r.total);
    const d = el.querySelector('[data-delta]');
    d.textContent = delta ? `+${inr(delta)}` : 'lowest';
    d.className = `delta num ${delta ? 'up' : 'same'}`;
  });

  const current = results.find((r) => r.id === state.strategy);
  $('#legs').innerHTML = html`<span class="eyebrow">${current.strategy.summary}</span>${current.legs.map((l) => legRow(l, state.travellers))}
    <p class="small muted legs-note">${icon('info')} Flights: ${CHECKED}, one adult, taxes in, 7 kg cabin bag only. Grab fares split by ${state.travellers}.</p>`;
  renderBerth(state, current.strategy.transit === 'train');
  $('#rejected').innerHTML = html`<summary>${icon('arrow')} Also checked, and dropped</summary>${REJECTED.map((r) => rejectedRow(r, state))}`;
  renderMap(current.strategy);
}
