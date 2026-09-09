import { $, $$, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { EXTRA_STOPS, catalogOf, isExtra, isFun, activityInr } from '../data/activities.js';
import { STOPS } from '../data/trip.js';
import { SOURCES } from '../data/sources.js';
import { findStrategy } from '../strategies.js';
import { planTrip, MAX_PER_DAY, dayOf } from '../plan.js';
import { tile, pickHandler } from './tile.js';
import { mountGalleries } from './gallery.js';
import { brainCta } from './brain.js';
import { votesCard } from './votes.js';
import { heartCount, totalHearts } from '../votes.js';

// Picker: one tab per stop, a tile per activity. Tap = on/off; the day cards
// re-pack themselves. Tiles show where they landed (D3) or why they did not
// (no room / closed / in a tour). Fun tiles first, then sights ("see" — they
// never take a slot). Off-route stops get their own "+days" strip.

const ROUTE_ORDER = ['hoian', 'danang', 'hue', 'hanoi', 'ninhbinh', 'halong'];
const KINDS = [['all', 'All', ''], ['fun', 'Fun', 'sparkle'], ['see', 'See', 'eye'], ['night', 'Nights', 'moon'], ['loved', 'Loved', 'heart']];
const stopName = (id) => STOPS.find((s) => s.id === id)?.name || EXTRA_STOPS.find((s) => s.id === id)?.name || id;

let tab = ROUTE_ORDER[0];
let kind = 'all';

const byKind = (x, state) => {
  if (kind === 'all') return true;
  if (kind === 'night') return x.slot === 'night';
  if (kind === 'loved') return heartCount(state, x.id) > 0;
  return (kind === 'fun') === isFun(x);
};
// Fun first, then must-dos, then what the group hearted most.
const tileOrder = (state) => (p, q) => (isFun(q) - isFun(p)) || (!!q.must - !!p.must) || (heartCount(state, q.id) - heartCount(state, p.id));

// Off-route picks are a wishlist: they never enter the 8-day cards or the budget,
// but each card totals what its picks would add if you stretched the trip.
const extraPicked = (state) => catalogOf(state).filter((x) => isExtra(x) && state.picks[x.id] && !x.closed);

const extraCard = (stop, state, plan) => {
  const items = catalogOf(state).filter((x) => x.stop === stop.id);
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
      <div class="extra-list">${[...items].sort(tileOrder(state)).map((x) => tile(x, state, plan))}</div>
    </div>`;
};

const tabs = (state, plan) => ROUTE_ORDER.map((id) => {
  const mine = catalogOf(state).filter((x) => x.stop === id);
  const on = mine.filter((x) => dayOf(plan, x.id) != null).length;
  return html`<label><input type="radio" name="picker-tab" value="${id}" ${tab === id ? 'checked' : ''} aria-label="${stopName(id)}" /><span>${stopName(id)}<span class="cnt num">${on}/${mine.length}</span></span></label>`;
}).join('');

const kindTabs = () => KINDS.map(([id, label, ic]) => html`<label><input type="radio" name="picker-kind" value="${id}" ${kind === id ? 'checked' : ''} aria-label="${label}" />${ic ? icon(ic) : ''}<span>${label}</span></label>`).join('');

export function mountPicker(store) {
  $('#picker-tabs').addEventListener('change', (e) => {
    if (e.target.name !== 'picker-tab') return;
    tab = e.target.value;
    renderPicker(store.get());
  });
  $('#picker-kind').addEventListener('change', (e) => {
    if (e.target.name !== 'picker-kind') return;
    kind = e.target.value;
    renderPicker(store.get());
  });
  const onPick = pickHandler(store);
  ['#picker-grid', '#picker-extra'].forEach((sel) => {
    $(sel).addEventListener('click', onPick);
    mountGalleries($(sel));
  });
  document.addEventListener('picker:show', (e) => {
    tab = e.detail;
    renderPicker(store.get());
    $('#picker').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export function renderPicker(state) {
  const plan = planTrip(state, findStrategy(state.strategy).transit);
  const all = catalogOf(state);
  const onRoute = all.filter((x) => !isExtra(x));
  const picked = onRoute.filter((x) => state.picks[x.id] && !x.closed).length;
  const extra = extraPicked(state);
  $('#picker-sum').innerHTML = html`
    <span class="chip chip-ink num">${icon('sparkle')}${plan.placed.size} fun</span>
    <span class="chip num">${icon('eye')}${plan.seen.size} see</span>
    <span class="chip num">${inr(plan.cost)} pp</span>
    ${plan.noRoom.length ? html`<span class="chip chip-sun num">${plan.noRoom.length} no room</span>` : ''}
    ${extra.length ? html`<a class="chip chip-lantern num" href="#picker-extra">${extra.length} need extra days</a>` : ''}
    ${totalHearts(state) ? html`<a class="chip chip-heart num" href="#votes">${icon('heart')}${totalHearts(state)}</a>` : ''}
    ${brainCta(plan.noRoom.length ? 'Some of my picks have no room. Rebalance: drop the least fun ones so everything I care about fits, and tell me what you dropped.' : 'Look at my picks and suggest what to switch on or off for a more fun, well-paced trip.', 'Tidy my picks')}
    <span class="sub">${picked}/${onRoute.length} picked · max ${MAX_PER_DAY} fun a day · sights ride along</span>`;
  $('#picker-tabs').innerHTML = tabs(state, plan);
  $('#picker-kind').innerHTML = kindTabs();
  const tiles = all.filter((x) => x.stop === tab && byKind(x, state)).sort(tileOrder(state));
  $('#picker-grid').innerHTML = tiles.length ? tiles.map((x) => tile(x, state, plan)).join('') : html`<p class="sub empty">${kind === 'loved' ? 'No hearts here yet.' : 'Nothing of that kind here.'}</p>`;
  $('#picker-votes').innerHTML = votesCard(state, plan);
  $('#picker-extra').innerHTML = html`
    <span class="eyebrow">Not on this route · needs extra days</span>
    <div class="extra-grid">${EXTRA_STOPS.map((s) => extraCard(s, state, plan))}</div>`;
  $$('#picker-tabs input').forEach((i) => { i.checked = i.value === tab; });
}
