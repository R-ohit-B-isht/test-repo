import { $, $$, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { ACTIVITIES, EXTRA_STOPS, isExtra, activityInr } from '../data/activities.js';
import { STOPS } from '../data/trip.js';
import { SOURCES } from '../data/sources.js';
import { findStrategy } from '../strategies.js';
import { planTrip, MAX_PER_DAY } from '../plan.js';
import { priceTag, srcIcon, includesText } from './picks.js';

// Picker: one tab per stop, a tile per activity. Tap = on/off; the day cards
// re-pack themselves. Tiles show where they landed (D3) or why they did not
// (no room / closed / in a tour). Off-route stops get their own "+days" strip.

const ROUTE_ORDER = ['hoian', 'danang', 'hue', 'hanoi', 'ninhbinh', 'halong'];
const stopName = (id) => STOPS.find((s) => s.id === id)?.name || EXTRA_STOPS.find((s) => s.id === id)?.name || id;

let tab = ROUTE_ORDER[0];

const statusOf = (x, state, plan) => {
  if (x.closed) return 'closed';
  if (plan.bundled.has(x.id)) return 'bundled';
  if (!state.picks[x.id]) return 'off';
  return plan.placed.has(x.id) ? 'on' : 'noroom';
};

const badge = (x, status, plan) => {
  if (status === 'on') return html`<span class="chip chip-ink num">D${plan.placed.get(x.id)}</span>`;
  if (status === 'noroom') return html`<span class="chip chip-sun">no room</span>`;
  if (status === 'bundled') return html`<span class="chip chip-jade">in tour</span>`;
  if (status === 'closed') return html`<span class="chip">closed</span>`;
  return '';
};

const tile = (x, state, plan) => {
  const status = statusOf(x, state, plan);
  const dead = status === 'closed' || status === 'bundled';
  // The card is a div with a full-bleed <button class="hit"> underneath, so the
  // source <a> can sit on top without nesting interactive content.
  return html`
    <div class="tile ${status === 'on' ? 'is-on' : ''} ${status === 'noroom' ? 'is-noroom' : ''} ${dead ? 'is-dead' : ''}">
      <button class="hit" type="button" data-pick="${x.id}" aria-pressed="${status === 'on' || status === 'noroom'}" ${dead ? 'disabled' : ''}
        aria-label="${x.name}" title="${x.closed || x.note || ''}"></button>
      <span class="ic-wrap">${icon(status === 'on' ? 'check' : x.icon)}</span>
      <span class="body">
        <span class="nm">${x.name}</span>
        <span class="sub">${x.closed || x.note || ''}${x.includes ? html` · incl. ${includesText(x)}` : ''}</span>
      </span>
      <span class="meta">${badge(x, status, plan)}${priceTag(x, state.travellers)}${srcIcon(x)}</span>
    </div>`;
};

// Off-route picks are a wishlist: they never enter the 8-day cards or the budget,
// but each card totals what its picks would add if you stretched the trip.
const extraPicked = (state) => ACTIVITIES.filter((x) => isExtra(x) && state.picks[x.id] && !x.closed);

const extraRow = (x, state) => {
  const on = Boolean(state.picks[x.id]) && !x.closed;
  return html`
    <div class="xl ${on ? 'is-on' : ''} ${x.closed ? 'is-dead' : ''}">
      <button class="hit" type="button" data-pick="${x.id}" aria-pressed="${on}" ${x.closed ? 'disabled' : ''} aria-label="${x.name}" title="${x.closed || x.note || ''}"></button>
      <span class="dot">${icon(on ? 'check' : x.icon)}</span>
      <span class="nm">${x.name}<span class="sub">${x.closed || x.note || ''}</span></span>
      <span class="meta">${priceTag(x, state.travellers)}${srcIcon(x)}</span>
    </div>`;
};

const extraCard = (stop, state) => {
  const items = ACTIVITIES.filter((x) => x.stop === stop.id);
  const on = items.filter((x) => state.picks[x.id] && !x.closed);
  const cost = on.reduce((s, x) => s + (activityInr(x, state.travellers) || 0), 0);
  const s = SOURCES[stop.src];
  return html`
    <div class="card extra ${on.length ? 'is-on' : ''}" data-stop="${stop.id}">
      <div class="extra-head">
        <span class="chip chip-lantern">+${stop.days} day${stop.days > 1 ? 's' : ''}</span>
        <b>${stop.name}</b>
        <span class="sub">${stop.how}${s ? html` <a class="src" href="${s.url}" target="_blank" rel="noopener" aria-label="Source: ${s.name}">${icon('link')}</a>` : ''}</span>
        ${on.length ? html`<span class="chip chip-jade num">${on.length} picked · ${cost ? `+${inr(cost)} pp` : 'free'}</span>` : ''}
      </div>
      <div class="extra-list">${items.map((x) => extraRow(x, state))}</div>
    </div>`;
};

const tabs = (state, plan) => ROUTE_ORDER.map((id) => {
  const mine = ACTIVITIES.filter((x) => x.stop === id);
  const on = mine.filter((x) => plan.placed.has(x.id)).length;
  return html`<label><input type="radio" name="picker-tab" value="${id}" ${tab === id ? 'checked' : ''} aria-label="${stopName(id)}" /><span>${stopName(id)}<span class="cnt num">${on}/${mine.length}</span></span></label>`;
}).join('');

export function mountPicker(store) {
  $('#picker-tabs').addEventListener('change', (e) => {
    if (e.target.name !== 'picker-tab') return;
    tab = e.target.value;
    renderPicker(store.get());
  });
  const onPick = (e) => {
    const b = e.target.closest('[data-pick]');
    if (b && !b.disabled && !e.target.closest('a')) store.togglePick(b.dataset.pick);
  };
  $('#picker-grid').addEventListener('click', onPick);
  $('#picker-extra').addEventListener('click', onPick);
  document.addEventListener('picker:show', (e) => {
    tab = e.detail;
    renderPicker(store.get());
    $('#picker').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function renderPicker(state) {
  const plan = planTrip(state, findStrategy(state.strategy).transit);
  const onRoute = ACTIVITIES.filter((x) => !isExtra(x));
  const picked = onRoute.filter((x) => state.picks[x.id] && !x.closed).length;
  const extra = extraPicked(state);
  $('#picker-sum').innerHTML = html`
    <span class="chip chip-ink num">${plan.placed.size} on the cards</span>
    <span class="chip num">${inr(plan.cost)} pp</span>
    ${plan.noRoom.length ? html`<span class="chip chip-sun num">${plan.noRoom.length} no room</span>` : ''}
    ${extra.length ? html`<a class="chip chip-lantern num" href="#picker-extra">${extra.length} need extra days</a>` : ''}
    <span class="sub">${picked}/${onRoute.length} picked · max ${MAX_PER_DAY} a day</span>`;
  $('#picker-tabs').innerHTML = tabs(state, plan);
  $('#picker-grid').innerHTML = ACTIVITIES.filter((x) => x.stop === tab).map((x) => tile(x, state, plan)).join('');
  $('#picker-extra').innerHTML = html`
    <span class="eyebrow">Not on this route · needs extra days</span>
    <div class="extra-grid">${EXTRA_STOPS.map((s) => extraCard(s, state))}</div>`;
  $$('#picker-tabs input').forEach((i) => { i.checked = i.value === tab; });
}
