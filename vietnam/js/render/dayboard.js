import { $, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { DAYS, SLOTS, SLOT_LABEL, sleepFor, mealsFor, whereFor } from '../data/days.js';
import { STOPS, WEATHER, dateOf, inrFromVnd, inrFromUsd } from '../data/trip.js';
import { PHOTOS } from '../data/photos.js';
import { SOURCES } from '../data/sources.js';
import { findStrategy } from '../strategies.js';
import { planTrip } from '../plan.js';
import { tile, pickHandler } from './tile.js';
import { mountGalleries } from './gallery.js';
import { brainCta } from './brain.js';
import { timelineView } from './timeline.js';
import { orderStrip } from './order.js';
import { orderClick, mountOrderDrag } from './orderDrag.js';

// Day board: tap a day card → full-screen dialog with that day as a photo grid,
// grouped Do / Get there / Eat / Sleep / Also see / Nearby. Every tile is the
// same toggle as in the picker, so the plan and the budget update underneath.

const MEAL = ['Breakfast', 'Lunch', 'Dinner'];

let open = null;
let lastFocus = null;
let view = 'grid'; // 'grid' (categories) | 'hours' (timeline)

const src = (key) => {
  const s = key && SOURCES[key];
  return s ? html`<a class="src" href="${s.url}" target="_blank" rel="noopener" aria-label="Source: ${s.name}" title="${s.name}">${icon('link')}</a>` : '';
};

const sec = (id, ic, label, count, body) => html`
  <section class="bsec bsec-${id}" aria-label="${label}">
    <h4 class="bh"><span class="ic-wrap">${icon(ic)}</span>${label}${count ? html`<span class="chip num">${count}</span>` : ''}</h4>
    ${body}
  </section>`;

const uniq = (items) => items.filter((x, i) => !x.cont && items.findIndex((y) => y.id === x.id) === i);

const doSec = (planned, state, plan) => {
  const items = uniq(SLOTS.flatMap((k) => planned.slots[k].items || []));
  return sec('do', 'sparkle', 'Do', items.length, items.length
    ? html`<div class="picker">${items.map((x) => tile(x, state, plan))}</div>`
    : html`<p class="sub empty">Open day — tap something in Nearby.</p>`);
};

const goSec = (planned) => {
  const legs = SLOTS.filter((k) => planned.slots[k].fixed).map((k) => ({ k, ...planned.slots[k] }));
  const leads = SLOTS.filter((k) => !planned.slots[k].fixed && planned.slots[k].lead).map((k) => ({ k, icon: 'pin', text: planned.slots[k].lead }));
  const all = [...legs, ...leads];
  return all.length ? sec('go', 'arrow', 'Get there', 0, html`
    <div class="bgo">${all.map((l) => html`
      <div class="bcard"><span class="ic-wrap">${icon(l.icon)}</span><span class="when">${SLOT_LABEL[l.k]}</span><span class="txt">${l.text}</span></div>`)}
    </div>`) : '';
};

const eatSec = (day, transit) => sec('eat', 'bowl', 'Eat', 0, html`
  <div class="beat">${mealsFor(day, transit).map((m, i) => html`
    <div class="bcard">
      <span class="ic-wrap num">${MEAL[i][0]}</span>
      <span class="when">${MEAL[i]}</span>
      <span class="txt"><b>${m.name}</b><span class="sub">${m.dish}</span></span>
      <span class="amt num">${m.vnd ? html`≈${inr(inrFromVnd(m.vnd))}` : m.src ? 'incl.' : '—'}${src(m.src)}</span>
    </div>`)}
  </div>`);

const sleepSec = (day, transit) => {
  const s = sleepFor(day, transit);
  return sec('sleep', 'bed', 'Sleep', 0, html`
    <div class="bcard">
      <span class="ic-wrap">${icon('moon')}</span>
      <span class="when">${s.area}</span>
      <span class="txt"><b>${s.name}</b></span>
      <span class="amt num">${s.usd ? html`≈${inr(inrFromUsd(s.usd))}` : ''}${src(s.src)}</span>
    </div>`);
};

const grid = (id, ic, label, items, state, plan) => (items.length
  ? sec(id, ic, label, items.length, html`<div class="picker">${items.map((x) => tile(x, state, plan))}</div>`)
  : '');

const viewSwitch = () => html`
  <div class="seg bview" role="tablist" aria-label="Day view">
    <button type="button" role="tab" data-view="grid" aria-selected="${String(view === 'grid')}">${icon('grid')}Grid</button>
    <button type="button" role="tab" data-view="hours" aria-selected="${String(view === 'hours')}">${icon('clock')}Hours</button>
  </div>`;

const body = (day, state, transit, plan, planned, near) => (view === 'hours'
  ? html`${timelineView(day, planned, transit)}${orderStrip(planned, state)}${grid('near', 'pin', 'Nearby · tap to add', near, state, plan)}`
  : html`
      ${doSec(planned, state, plan)}
      ${orderStrip(planned, state)}
      ${goSec(planned)}
      ${eatSec(day, transit)}
      ${sleepSec(day, transit)}
      ${grid('see', 'eye', 'Also see', planned.see, state, plan)}
      ${grid('near', 'pin', 'Nearby · tap to add', near, state, plan)}`);

const board = (day, state, transit, plan) => {
  const stop = STOPS.find((s) => s.id === day.stop);
  const wx = WEATHER[day.weather];
  const photo = PHOTOS[day.photo];
  const planned = plan.days[day.n - 1];
  const near = plan.nearby[day.n - 1].map((n) => n.x);
  return html`
    <div class="bhero">
      <img src="assets/photos/${day.photo}.jpg" alt="${photo.alt}" width="${photo.w}" height="${photo.h}" style="object-position: ${photo.pos || "50% 50%"}" decoding="async" />
      <div class="bhero-txt">
        <span class="eyebrow">Day ${day.n} · ${dateOf(day.n)} · ${whereFor(day, transit) || stop.name}</span>
        <h3 id="board-title">${day.title}</h3>
        <div class="row"><span class="chip ${wx.icon === 'sun' ? 'chip-sun' : 'chip-rain'}" title="${wx.note}">${icon(wx.icon)} ${wx.temp}</span>${brainCta(`Day ${day.n} (${day.title}): make this day more fun. Only change picks that land on day ${day.n} or nearby at the same stop.`, 'Improve this day')}</div>
      </div>
      <div class="bnav">
        <button class="btn-icon" type="button" data-board-go="-1" ${day.n === 1 ? 'disabled' : ''} aria-label="Previous day">‹</button>
        <button class="btn-icon" type="button" data-board-go="1" ${day.n === DAYS.length ? 'disabled' : ''} aria-label="Next day">›</button>
        <button class="btn-icon" type="button" data-close aria-label="Close">×</button>
      </div>
    </div>
    <div class="bbody">
      ${viewSwitch()}
      ${body(day, state, transit, plan, planned, near)}
    </div>`;
};

const setOpen = (root, n) => {
  open = n;
  root.dataset.open = String(n != null);
  root.setAttribute('aria-hidden', String(n == null));
  document.body.classList.toggle('is-locked', n != null);
};

export function mountDayBoard(store) {
  const root = $('#board');
  const card = $('.card', root);
  const onPick = pickHandler(store);
  const close = () => { setOpen(root, null); lastFocus?.focus(); lastFocus = null; };
  const show = (n) => {
    if (open == null) lastFocus = document.activeElement;
    setOpen(root, n);
    renderDayBoard(store.get());
    card.scrollTop = 0;
    $('[data-close]', root).focus();
  };
  const planFor = (s) => planTrip(s, findStrategy(s.strategy).transit);
  document.addEventListener('day:open', (e) => show(e.detail));
  root.addEventListener('click', (e) => {
    if (e.target === root || e.target.closest('[data-close]')) return close();
    const go = e.target.closest('[data-board-go]');
    if (go) return show(Math.min(DAYS.length, Math.max(1, open + Number(go.dataset.boardGo))));
    const v = e.target.closest('[data-view]');
    if (v) { view = v.dataset.view; return renderDayBoard(store.get()); }
    if (orderClick(store, e, planFor)) return undefined;
    return onPick(e);
  });
  mountOrderDrag(root, store, planFor);
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return close();
    if (e.target.closest('.pics-track') || e.altKey || e.metaKey || e.ctrlKey) return undefined;
    if (e.key === 'ArrowLeft' && open > 1) return show(open - 1);
    if (e.key === 'ArrowRight' && open < DAYS.length) return show(open + 1);
    return undefined;
  });
  mountGalleries(root);
}

export function renderDayBoard(state) {
  if (open == null) return;
  const transit = findStrategy(state.strategy).transit;
  const plan = planTrip(state, transit);
  const card = $('#board .card');
  const y = card.scrollTop;
  card.innerHTML = board(DAYS[open - 1], state, transit, plan);
  card.scrollTop = y;
}
