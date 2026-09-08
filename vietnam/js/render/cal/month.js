import { html } from '../../dom.js';
import { icon } from '../../icons.js';
import { TRIP, STOPS } from '../../data/trip.js';
import { DAYS, SLOTS, whereFor, sleepFor } from '../../data/days.js';
import { PHOTOS } from '../../data/photos.js';
import { addDays, dayOf, fmtDate, parseISO, toISO } from '../../export/dates.js';
import { onDate } from '../../events.js';
import { chip, more } from './chips.js';

// Month view. Trip days keep their photo cells (tap → day board); every other
// day is a plain cell listing its events (deadlines, documents, yours) with a
// "+n more" spill. Weeks start on Monday.

export const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const mondayBefore = (iso) => addDays(iso, -((parseISO(iso).getDay() + 6) % 7));
export const monthOf = (iso) => iso.slice(0, 7);
export const firstOf = (ym) => `${ym}-01`;
export const shiftMonth = (ym, n) => { const d = new Date(`${ym}-01T00:00:00`); d.setMonth(d.getMonth() + n); return toISO(d).slice(0, 7); };
export const monthLabel = (ym) => new Date(`${ym}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

const MAX_CHIPS = 3;
const NOT_ON_TRIP = new Set(['day', 'do', 'eat', 'flight', 'ground']);

const pickChips = (planned) => {
  const seen = new Set();
  const items = SLOTS.flatMap((k) => planned.slots[k].items || []).filter((x) => !x.cont && !seen.has(x.id) && seen.add(x.id));
  return items.map((x) => html`<span class="cchip">${icon(x.icon)}<span>${x.name}</span></span>`);
};
const fixedChips = (planned) => SLOTS.filter((k) => planned.slots[k].fixed)
  .map((k) => html`<span class="cchip cfix">${icon(planned.slots[k].icon)}<span>${planned.slots[k].text.split(' · ')[0]}</span></span>`);

// Extra events on a trip day (a deadline, a document, one of yours) ride on
// top of the photo as their own buttons, so they stay one tap away.
const extras = (evs, iso) => {
  const own = evs.filter((e) => !NOT_ON_TRIP.has(e.kind));
  if (!own.length) return '';
  return html`<span class="cextra">${own.slice(0, 2).map((e) => chip(e, { cls: 'on-photo' }))}${own.length > 2 ? more(own.length - 2, iso) : ''}</span>`;
};

const tripCell = (day, iso, transit, plan, evs, out) => {
  const photo = PHOTOS[day.photo];
  const planned = plan.days[day.n - 1];
  const bed = sleepFor(day, transit);
  const stop = STOPS.find((s) => s.id === day.stop);
  return html`
    <div class="ccell is-trip ${out ? 'is-out' : ''}" role="gridcell" data-iso="${iso}">
      <img src="assets/photos/${day.photo}.jpg" alt="" width="${photo.w}" height="${photo.h}" loading="lazy" decoding="async" style="object-position: ${photo.pos || '50% 50%'}" />
      <button class="cmain" type="button" data-day="${day.n}" aria-label="Day ${day.n}, ${fmtDate(iso)}, ${day.title}. Open the day board."></button>
      <span class="cdate num">${Number(iso.slice(8))}<em>D${day.n}</em></span>
      <span class="cwhere">${whereFor(day, transit) || stop.name}</span>
      ${extras(evs, iso)}
      <span class="cchips">${fixedChips(planned)}${pickChips(planned)}</span>
      <span class="cbed">${icon(bed.usd ? 'bed' : 'moon')}<span>${bed.name}</span></span>
    </div>`;
};

const flyCell = (iso, evs) => {
  const fly = evs.find((e) => e.kind === 'flight');
  const rest = evs.filter((e) => e !== fly);
  return html`
    <div class="ccell is-fly" role="gridcell" data-iso="${iso}">
      <button class="cmain" type="button" data-date="${iso}" aria-label="${fmtDate(iso)}, fly out of Delhi. Show the day."></button>
      <span class="cdate num">${Number(iso.slice(8))}<em>D0</em></span>
      <span class="cwhere">${TRIP.origin}</span>
      <span class="cextra">${chip(fly, { cls: 'on-photo', time: true })}${rest.slice(0, 2).map((e) => chip(e, { cls: 'on-photo' }))}${rest.length > 2 ? more(rest.length - 2, iso) : ''}</span>
    </div>`;
};

const plainCell = (iso, evs, out, today) => html`
  <div class="ccell ${evs.length ? 'has-ev' : ''} ${out ? 'is-out' : ''} ${today ? 'is-today' : ''}" role="gridcell" data-iso="${iso}">
    <button class="cmain" type="button" data-date="${iso}" aria-label="${fmtDate(iso)}${evs.length ? `, ${evs.length} event${evs.length > 1 ? 's' : ''}` : ''}. Show the day."></button>
    <span class="cdate num">${Number(iso.slice(8))}${today ? html`<em>Today</em>` : ''}</span>
    <span class="cev">${evs.slice(0, MAX_CHIPS).map((e) => chip(e))}${evs.length > MAX_CHIPS ? more(evs.length - MAX_CHIPS, iso) : ''}</span>
  </div>`;

const cell = (iso, ym, transit, plan, events, today) => {
  const n = dayOf(iso);
  const evs = onDate(events, iso);
  const out = !iso.startsWith(ym);
  if (n >= 1) return tripCell(DAYS[n - 1], iso, transit, plan, evs, out);
  if (n === 0 && evs.some((e) => e.kind === 'flight')) return flyCell(iso, evs);
  return plainCell(iso, evs, out, iso === today);
};

export const monthView = (ym, transit, plan, events, today) => {
  const first = mondayBefore(firstOf(ym));
  const last = mondayBefore(addDays(firstOf(shiftMonth(ym, 1)), -1));
  const weeks = Math.round((parseISO(last) - parseISO(first)) / 864e5 / 7) + 1;
  const cells = Array.from({ length: weeks * 7 }, (_, i) => cell(addDays(first, i), ym, transit, plan, events, today));
  return html`
    <div class="crow chead" role="row">${WD.map((w) => html`<span role="columnheader">${w}</span>`)}</div>
    ${Array.from({ length: weeks }, (_, w) => html`<div class="crow" role="row">${cells.slice(w * 7, w * 7 + 7)}</div>`)}`;
};
