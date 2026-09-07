import { PRICES } from '../data/prices.js';
import { SOURCES } from '../data/sources.js';
import { TRIP } from '../data/trip.js';
import { STRATEGIES, transportTotal } from '../strategies.js';
import { fmt } from '../budget.js';
import { html, raw, $, $$ } from '../dom.js';

const SHIP_CLASSES = [
  { id: 'second', name: 'Second class', hint: 'AC push-back seat' },
  { id: 'first', name: 'First class', hint: 'Cabin berth' },
];

function segButton(id, checked, name, sub, tag) {
  return html`
    <button type="button" class="seg" role="radio" data-id="${id}" aria-checked="${checked}">
      <span class="seg__name">${name}</span>
      <span class="seg__price">${sub}</span>
      ${tag ? raw(html`<span class="seg__tag">${tag}</span>`) : ''}
    </button>`;
}

function bindRadios(root, onPick) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.seg');
    if (btn) onPick(btn.dataset.id);
  });
  root.addEventListener('keydown', (e) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    const items = $$('.seg', root);
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    const next = items[(i + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length];
    next.focus();
    onPick(next.dataset.id);
  });
}

// Update in place when possible so keyboard focus survives a re-render.
function syncSegs(root, items) {
  const existing = $$('.seg', root);
  if (existing.length !== items.length) {
    root.innerHTML = items.map((it) => segButton(it.id, it.checked, it.name, it.sub, it.tag)).join('');
    return;
  }
  existing.forEach((btn, i) => {
    btn.setAttribute('aria-checked', String(items[i].checked));
    $('.seg__price', btn).textContent = items[i].sub;
  });
}

export function mountRoute(store) {
  bindRadios($('#strategy-picker'), (id) => store.set({ strategy: id }));
  bindRadios($('#ship-class'), (id) => store.set({ shipClass: id }));
}

function legRow(leg, i) {
  const src = SOURCES[leg.price.source];
  return html`
    <li class="leg" style="--i:${i}">
      <span class="leg__n">0${i + 1}</span>
      <span class="leg__route">
        <strong>${leg.from} → ${leg.to}</strong>
        <span class="leg__mode">${leg.mode}</span>
      </span>
      <span class="leg__price">${fmt(leg.price.amount)}
        <small>${leg.price.range} · <a href="${src.url}" target="_blank" rel="noopener">source</a></small>
      </span>
    </li>`;
}

let lastKey = '';

export function renderRoute(state) {
  syncSegs($('#strategy-picker'), STRATEGIES.map((s) => ({
    id: s.id, checked: s.id === state.strategy, name: s.name, sub: fmt(transportTotal(s, PRICES, state)), tag: s.recommended ? 'Recommended' : '',
  })));
  syncSegs($('#ship-class'), SHIP_CLASSES.map((c) => ({ id: c.id, checked: c.id === state.shipClass, name: c.name, sub: c.hint, tag: '' })));

  const key = `${state.strategy}:${state.shipClass}`;
  if (key === lastKey) return;
  lastKey = key;

  const strategy = STRATEGIES.find((s) => s.id === state.strategy);
  const legs = strategy.legs(PRICES, state);
  const total = legs.reduce((s, l) => s + l.price.amount, 0);
  const saving = TRIP.quotedRoundTrip - total;
  $('#route-view').innerHTML = html`
    <ol>${raw(legs.map(legRow).join(''))}</ol>
    <div class="route__total">
      <span>${strategy.summary}</span>
      <strong>${fmt(total)} <span class="is-good">· ${fmt(saving)} under the quote</span></strong>
    </div>`;
  $('#strategy-note').textContent = strategy.itineraryNote;
}
