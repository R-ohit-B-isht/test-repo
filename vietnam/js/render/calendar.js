import { $, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { TRIP, STOPS, isoOf } from '../data/trip.js';
import { DAYS, SLOTS, whereFor, sleepFor } from '../data/days.js';
import { PHOTOS } from '../data/photos.js';
import { PRICES } from '../data/prices.js';
import { findStrategy } from '../strategies.js';
import { planTrip } from '../plan.js';
import { addDays, dayOf, fmtDate } from '../export/dates.js';
import { ICS_NAME, buildICS } from '../export/ics.js';

// Calendar page: a month grid (Mon-first) around the trip dates. Each trip day
// is a photo cell with its picks, fixed legs and bed; the day before day 1
// carries the Delhi departure on open-jaw routes. Tap a cell → day board.

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const mondayBefore = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return addDays(iso, -((d.getDay() + 6) % 7));
};

const flyOut = (state) => {
  const leg = findStrategy(state.strategy).legs(PRICES, state)[0];
  return leg.price.iso && leg.price.iso < TRIP.start ? { iso: leg.price.iso, leg } : null;
};

const pickChips = (planned) => {
  const seen = new Set();
  const items = SLOTS.flatMap((k) => planned.slots[k].items || []).filter((x) => !x.cont && !seen.has(x.id) && seen.add(x.id));
  return items.map((x) => html`<span class="cchip">${icon(x.icon)}<span>${x.name}</span></span>`);
};

const fixedChips = (planned) => SLOTS.filter((k) => planned.slots[k].fixed)
  .map((k) => html`<span class="cchip cfix">${icon(planned.slots[k].icon)}<span>${planned.slots[k].text.split(' · ')[0]}</span></span>`);

const tripCell = (day, iso, state, transit, plan) => {
  const photo = PHOTOS[day.photo];
  const planned = plan.days[day.n - 1];
  const bed = sleepFor(day, transit);
  const stop = STOPS.find((s) => s.id === day.stop);
  return html`
    <button class="ccell is-trip" type="button" role="gridcell" data-day="${day.n}" aria-label="Day ${day.n}, ${fmtDate(iso)}, ${day.title}. Open the day board.">
      <img src="assets/photos/${day.photo}.jpg" alt="" width="${photo.w}" height="${photo.h}" loading="lazy" decoding="async" style="object-position: ${photo.pos || '50% 50%'}" />
      <span class="cdate num">${Number(iso.slice(8))}<em>D${day.n}</em></span>
      <span class="cwhere">${whereFor(day, transit) || stop.name}</span>
      <span class="cchips">${fixedChips(planned)}${pickChips(planned)}</span>
      <span class="cbed">${icon(bed.usd ? 'bed' : 'moon')}<span>${bed.name}</span></span>
    </button>`;
};

const flyCell = (iso, fo) => html`
  <div class="ccell is-fly" role="gridcell" aria-label="${fmtDate(iso)}, fly out of Delhi">
    <span class="cdate num">${Number(iso.slice(8))}<em>D0</em></span>
    <span class="cwhere">${TRIP.origin}</span>
    <span class="cchips"><span class="cchip cfix">${icon('plane')}<span>${fo.leg.from} → ${fo.leg.to}</span></span></span>
    <span class="cbed"><span>${fo.leg.price.range.split(' · ')[0]} · ${fo.leg.price.carrier}</span></span>
  </div>`;

const blankCell = (iso) => html`
  <div class="ccell" role="gridcell" aria-label="${fmtDate(iso)}"><span class="cdate num">${Number(iso.slice(8))}</span></div>`;

const cell = (iso, state, transit, plan, fo) => {
  const n = dayOf(iso);
  if (n >= 1) return tripCell(DAYS[n - 1], iso, state, transit, plan);
  if (fo && iso === fo.iso) return flyCell(iso, fo);
  return blankCell(iso);
};

const gridView = (state) => {
  const transit = findStrategy(state.strategy).transit;
  const plan = planTrip(state, transit);
  const fo = flyOut(state);
  const first = mondayBefore(fo ? fo.iso : TRIP.start);
  const last = addDays(TRIP.start, TRIP.days - 1);
  const weeks = Math.ceil((Math.round((new Date(`${last}T00:00:00`) - new Date(`${first}T00:00:00`)) / 864e5) + 1) / 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => cell(addDays(first, i), state, transit, plan, fo));
  return html`
    <div class="crow chead" role="row">${WD.map((w) => html`<span role="columnheader">${w}</span>`)}</div>
    ${Array.from({ length: weeks }, (_, w) => html`<div class="crow" role="row">${cells.slice(w * 7, w * 7 + 7)}</div>`)}`;
};

const legend = (state) => {
  const transit = findStrategy(state.strategy).transit;
  const plan = planTrip(state, transit);
  return html`
    <span class="cchip cfix">${icon('train')}fixed leg</span>
    <span class="cchip">${icon('sparkle')}pick</span>
    <span class="chip num">${plan.placed.size} picks · ${inr(plan.cost)} pp</span>
    <span class="sub">October 2026 · tap a day for the board</span>`;
};

let icsUrl = null;

export function mountCalendar(store) {
  const grid = $('#cal-grid');
  if (!grid) return;
  grid.addEventListener('click', (e) => {
    const c = e.target.closest('[data-day]');
    if (c) document.dispatchEvent(new CustomEvent('day:open', { detail: Number(c.dataset.day) }));
  });
  $('#cal-actions').innerHTML = html`<a class="btn" id="cal-ics" download="${ICS_NAME}" href="#">${icon('calendar')}Add to calendar</a>`;
  void store;
}

export function renderCalendar(state) {
  const grid = $('#cal-grid');
  if (!grid) return;
  grid.innerHTML = gridView(state);
  $('#cal-legend').innerHTML = legend(state);
  if (icsUrl) URL.revokeObjectURL(icsUrl);
  icsUrl = URL.createObjectURL(new Blob([buildICS(state)], { type: 'text/calendar;charset=utf-8' }));
  $('#cal-ics').href = icsUrl;
}
