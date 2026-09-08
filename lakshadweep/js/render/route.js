// Section 01: islands map card, strategy radio cards, legs card with fare
// statuses and sources, class pickers. Selection flows through the store.
import { SOURCES } from '../data/sources.js';
import { FARE_STATUS } from '../data/prices.js';
import { TRIP } from '../data/trip.js';
import { STRATEGIES, SHIP_CLASSES, TRAIN_CLASSES } from '../strategies.js';
import { compareStrategies, cheapest, fmt, fmtK } from '../budget.js';
import { html, raw, $, fmtDate } from '../dom.js';
import { icon } from '../icons.js';
import { bindRadios, syncChecked } from './segmented.js';
import { routeMap } from './map.js';

const vs = (transport) => {
  const diff = TRIP.quotedRoundTrip - transport;
  return diff >= 0
    ? html`<span class="vs is-good">${fmtK(diff)} under the ₹40k ticket</span>`
    : html`<span class="vs is-over">${fmtK(-diff)} over the ₹40k ticket</span>`;
};

const delta = (row, low) => (row.perPerson - low > 0 ? html`<small class="delta">+${fmtK(row.perPerson - low)}</small>` : html`<small class="delta is-low">lowest</small>`);

function card(row, max, low, badge, checked) {
  const { strategy: s, plan } = row;
  return html`
    <button type="button" class="route-card" role="radio" data-id="${s.id}" aria-checked="${checked}" tabindex="${checked ? 0 : -1}">
      <span class="radio" aria-hidden="true"></span>
      <span class="name">${s.name}<span class="badge ${badge ? 'badge-jade' : ''}">${badge || s.badge}</span></span>
      <span class="price">${fmt(row.perPerson)}${raw(delta(row, low))}</span>
      <span class="sub"><span class="mode-chips">${raw(plan.legs.map((l) => icon(l.icon)).join(''))}</span><span>${plan.length} days · ${plan.islandNights} island nights</span>${raw(vs(row.transport))}</span>
      <span class="blurb">${s.blurb}</span>
      <span class="bar" aria-hidden="true"><i style="width:${Math.round((row.perPerson / max) * 100)}%"></i></span>
    </button>`;
}

const price = (p) => (p.status === 'unavailable' ? 'quote' : fmt(p.amount));
const hours = (h) => (h >= 24 ? `${Math.round(h / 24)} d` : `${h} h`);

function leg(l) {
  const p = l.price;
  const src = SOURCES[p.source];
  const status = FARE_STATUS[p.status];
  return html`
    <li class="leg" data-status="${p.status}">
      ${raw(icon(l.icon))}
      <span><span class="where">${l.from} → ${l.to}</span>
        <span class="mode">${l.mode}${l.via ? ` · via ${l.via.join(', ')}` : ''} · ${hours(l.hours)}${l.date ? raw(html` · <time datetime="${l.date}">${fmtDate(l.date)}</time>`) : ''}</span></span>
      <span class="fare">${l.package ? 'in package' : price(p)}<small>${status.label}${p.tbc ? ' · TBC' : ''}</small></span>
      <details><summary title="${status.hint}">${raw(icon('right'))}${p.label}</summary>
        <p>${p.date ? `Seen for ${fmtDate(p.date)} · ` : ''}${p.range} · ${p.unit} · ${status.hint} <a class="src" href="${src.url}" target="_blank" rel="noopener">${src.name} ↗</a></p></details>
    </li>`;
}

function classGroup(id, label, options, checked) {
  return html`
    <fieldset role="radiogroup" aria-label="${label}" data-group="${id}">
      <legend class="eyebrow">${label}</legend>
      <div class="seg">${raw(options.map((o) => html`
        <button type="button" role="radio" data-group="${id}" data-id="${o.id}" aria-checked="${o.id === checked}" tabindex="${o.id === checked ? 0 : -1}">${o.name}<small>${o.hint}</small></button>`).join(''))}</div>
    </fieldset>`;
}

export function mountRoute(store) {
  bindRadios($('#strategy-picker'), (id) => store.set({ strategy: id }));
  bindRadios($('#class-picker'), (id, group) => store.set(group === 'ship' ? { shipClass: id } : { trainClass: id }));
}

let cardsKey = '';
let legsKey = '';
let mapKey = '';

export function renderRoute(state) {
  const rows = compareStrategies(state);
  const best = cheapest(rows, 'perPerson');
  const bestTen = cheapest(rows.filter((r) => r.plan.length === 10), 'perPerson');
  const max = Math.max(...rows.map((r) => r.perPerson));
  const key = rows.map((r) => r.perPerson).join(',');
  if (key !== cardsKey) {
    cardsKey = key;
    const badgeFor = (r) => (r === best ? 'Cheapest' : r === bestTen ? 'Cheapest 10 days' : '');
    $('#strategy-picker').innerHTML = rows.map((r) => card(r, max, best.perPerson, badgeFor(r), r.strategy.id === state.strategy)).join('');
  }
  syncChecked($('#strategy-picker'), state.strategy);

  const row = rows.find((r) => r.strategy.id === state.strategy);
  const { plan } = row;
  const lKey = `${state.strategy}:${state.shipClass}:${state.trainClass}`;
  if (lKey !== legsKey) {
    legsKey = lKey;
    $('#route-view').innerHTML = html`
      <div class="card-head"><h3>${plan.strategy.name}</h3><span class="chip">${plan.legs.length} legs · ${Math.round(plan.travelHours)} h moving</span></div>
      <ol class="legs">${raw(plan.legs.map(leg).join(''))}</ol>
      <p class="legs-total"><span>Getting there &amp; back${plan.legs.some((l) => l.package) ? ', cabin and meals in' : ''}</span><b>${fmt(row.transport)}</b>${raw(vs(row.transport))}</p>`;
    const hasShip = plan.legs.some((l) => l.icon === 'ship' && !l.package);
    const hasTrain = plan.legs.some((l) => l.icon === 'train');
    $('#class-picker').innerHTML = [
      hasShip ? classGroup('ship', 'Ship class', SHIP_CLASSES, state.shipClass) : '',
      hasTrain ? classGroup('train', 'Train class', TRAIN_CLASSES, state.trainClass) : '',
    ].join('');
  }
  $('#class-picker').querySelectorAll('[role="radiogroup"]').forEach((g) => syncChecked(g, g.dataset.group === 'ship' ? state.shipClass : state.trainClass));

  const mKey = `${lKey}:${JSON.stringify(state.picks)}`;
  if (mKey !== mapKey) {
    mapKey = mKey;
    $('#route-map').innerHTML = routeMap(plan) + html`<figcaption class="map__cap">To scale · D1, D2… where each day is spent · ○ picked, off route · tap a day</figcaption>`;
  }
}

export function nextStrategy(state) {
  const i = STRATEGIES.findIndex((s) => s.id === state.strategy);
  return STRATEGIES[(i + 1) % STRATEGIES.length].id;
}
