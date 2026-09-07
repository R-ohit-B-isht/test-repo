// Section 01: strategy comparison cards, journey strip, class pickers.
import { SOURCES } from '../data/sources.js';
import { TRIP } from '../data/trip.js';
import { STRATEGIES, SHIP_CLASSES, TRAIN_CLASSES } from '../strategies.js';
import { compareStrategies, cheapest, fmt, fmtK } from '../budget.js';
import { html, raw, $ } from '../dom.js';
import { icon } from '../icons.js';
import { bindRadios, syncChecked } from './segmented.js';

function card(row, max, badge, best, checked) {
  const { strategy: s, plan } = row;
  const pct = Math.round((row.essentials / max) * 100);
  return html`
    <button type="button" class="card ${best ? 'card--best' : ''}" role="radio" data-id="${s.id}" aria-checked="${checked}" tabindex="${checked ? 0 : -1}">
      <span class="card__badge">${badge || s.badge}</span>
      <span class="card__icons">${raw(plan.legs.map((l) => icon(l.icon)).join(''))}</span>
      <span class="card__name">${s.name}</span>
      <span class="card__num">${fmt(row.essentials)}</span>
      <span class="card__bar" aria-hidden="true"><i style="width:${pct}%"></i></span>
      <span class="card__meta">${plan.length} days · ${plan.islandNights} island nights · ${Math.round(plan.travelHours)} h moving</span>
    </button>`;
}

function legNode(name, i) {
  return html`<li class="jn" style="--i:${i}"><span class="jn__dot"></span><span class="jn__name">${name}</span></li>`;
}

function legEdge(leg, i) {
  const src = SOURCES[leg.price.source];
  const to = leg.via ? `${leg.via.join(' · ')}` : '';
  return html`
    <li class="je" style="--i:${i}" data-mode="${leg.icon}">
      <span class="je__line" aria-hidden="true"></span>
      <span class="je__icon">${raw(icon(leg.icon))}</span>
      <span class="je__mode">${leg.mode}${to ? raw(html`<br />${to}`) : ''}</span>
      <span class="je__price">${fmt(leg.price.amount)}</span>
      <span class="je__hours">${leg.hours >= 24 ? `${Math.round(leg.hours / 24)} d` : `${leg.hours} h`}</span>
      <details class="je__more"><summary aria-label="Fare details for ${leg.from} to ${leg.to}">i</summary>
        <span>${leg.price.range} · <a href="${src.url}" target="_blank" rel="noopener">source</a></span></details>
    </li>`;
}

function vsQuote(transport) {
  const diff = TRIP.quotedRoundTrip - transport;
  return diff >= 0
    ? html`<span class="is-good">${fmtK(diff)} under the ${fmtK(TRIP.quotedRoundTrip)} ticket</span>`
    : html`<span class="is-over">${fmtK(-diff)} over the ${fmtK(TRIP.quotedRoundTrip)} ticket</span>`;
}

function classGroup(id, label, options, checked) {
  return html`
    <fieldset class="field" role="radiogroup" aria-label="${label}" data-group="${id}">
      <legend class="label">${label}</legend>
      <div class="segmented segmented--small">${raw(options.map((o) => html`
        <button type="button" class="seg" role="radio" data-group="${id}" data-id="${o.id}" aria-checked="${o.id === checked}" tabindex="${o.id === checked ? 0 : -1}">
          <span class="seg__name">${o.name}</span><span class="seg__price">${o.hint}</span>
        </button>`).join(''))}</div>
    </fieldset>`;
}

export function mountRoute(store) {
  bindRadios($('#strategy-picker'), (id) => store.set({ strategy: id }));
  bindRadios($('#class-picker'), (id, group) => store.set(group === 'ship' ? { shipClass: id } : { trainClass: id }));
}

let cardsKey = '';
let journeyKey = '';

export function renderRoute(state) {
  const rows = compareStrategies(state);
  const best = cheapest(rows);
  const bestTen = cheapest(rows.filter((r) => r.plan.length === 10));
  const max = Math.max(...rows.map((r) => r.essentials));
  const key = rows.map((r) => r.essentials).join(',');
  if (key !== cardsKey) {
    cardsKey = key;
    const badgeFor = (r) => (r === best ? 'Cheapest overall' : r === bestTen ? 'Cheapest 10 days' : '');
    $('#strategy-picker').innerHTML = rows.map((r) => card(r, max, badgeFor(r), r === best, r.strategy.id === state.strategy)).join('');
  }
  syncChecked($('#strategy-picker'), state.strategy);

  const row = rows.find((r) => r.strategy.id === state.strategy);
  const jKey = `${state.strategy}:${state.shipClass}:${state.trainClass}`;
  if (jKey !== journeyKey) {
    journeyKey = jKey;
    const legs = row.plan.legs;
    const items = legs.flatMap((l, i) => [legNode(l.from, i), legEdge(l, i)]);
    items.push(legNode(legs[legs.length - 1].to, legs.length));
    $('#route-view').innerHTML = html`
      <ol class="journey__strip">${raw(items.join(''))}</ol>
      <p class="journey__total"><strong>${fmt(row.transport)}</strong> to get there and back${row.plan.legs.some((l) => l.package) ? ', cabin and meals included' : ''} · ${raw(vsQuote(row.transport))}</p>`;

    const hasShip = legs.some((l) => l.icon === 'ship' && !l.package);
    const hasTrain = legs.some((l) => l.icon === 'train');
    $('#class-picker').innerHTML = [
      hasShip ? classGroup('ship', 'Ship class', SHIP_CLASSES, state.shipClass) : '',
      hasTrain ? classGroup('train', 'Train class', TRAIN_CLASSES, state.trainClass) : '',
    ].join('');
  }
  $('#class-picker').querySelectorAll('[data-group]').forEach((g) => {
    if (g.getAttribute('role') === 'radiogroup') syncChecked(g, g.dataset.group === 'ship' ? state.shipClass : state.trainClass);
  });
}

export function nextStrategy(state) {
  const i = STRATEGIES.findIndex((s) => s.id === state.strategy);
  return STRATEGIES[(i + 1) % STRATEGIES.length].id;
}
