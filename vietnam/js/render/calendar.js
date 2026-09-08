import { $, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { TRIP } from '../data/trip.js';
import { findStrategy } from '../strategies.js';
import { planTrip } from '../plan.js';
import { eventsFor, inMonth, KINDS } from '../events.js';
import { addDays, toISO } from '../export/dates.js';
import { ICS_NAME, buildICS } from '../export/ics.js';
import { monthView, mondayBefore, monthOf, shiftMonth, monthLabel } from './cal/month.js';
import { weekView } from './cal/week.js';
import { agendaView } from './cal/agenda.js';
import { openSheet } from './sheet.js';
import { gcalPanel, mountGcalPanel } from './gcalPanel.js';

// Calendar page controller. View state (which of month / week / agenda, and the
// cursor date) lives here and in the URL hash (#calendar/week/2026-10-26) so a
// reload or a shared link lands on the same view. Everything drawn comes from
// eventsFor(state); clicks bubble up to one handler that opens the day board
// for trip days and the event sheet for everything else.

const VIEWS = ['month', 'week', 'agenda'];
const today = () => toISO(new Date());
let view = 'month';
let cursor = TRIP.start;
let icsUrl = null;
let store = null;

const parseHash = () => {
  const m = location.hash.match(/^#calendar\/(month|week|agenda)(?:\/(\d{4}-\d{2}-\d{2}))?$/);
  if (m) { view = m[1]; cursor = m[2] || cursor; }
};
const writeHash = () => history.replaceState(null, '', `#calendar/${view}/${cursor}`);

const step = (n) => (view === 'week' ? addDays(cursor, 7 * n) : `${shiftMonth(monthOf(cursor), n)}-01`);
const weekLabel = (monday) => {
  const sun = addDays(monday, 6);
  const a = new Date(`${monday}T00:00:00`); const b = new Date(`${sun}T00:00:00`);
  const same = a.getMonth() === b.getMonth();
  return `${a.getDate()}${same ? '' : ` ${a.toLocaleDateString('en-IN', { month: 'short' })}`} – ${b.getDate()} ${b.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`;
};
const label = () => (view === 'week' ? weekLabel(mondayBefore(cursor)) : monthLabel(monthOf(cursor)));

const toolbar = () => html`
  <div class="cal-nav">
    <button class="btn-icon" type="button" data-step="-1" aria-label="Previous ${view === 'week' ? 'week' : 'month'}">${icon('chevron', 'flip')}</button>
    <h2 class="cal-label" aria-live="polite">${label()}</h2>
    <button class="btn-icon" type="button" data-step="1" aria-label="Next ${view === 'week' ? 'week' : 'month'}">${icon('chevron')}</button>
    <span class="cal-jumps">
      <button class="btn btn-ghost" type="button" data-jump="today">Today</button>
      <button class="btn btn-ghost" type="button" data-jump="trip">Trip</button>
    </span>
  </div>
  <div class="seg" role="radiogroup" aria-label="Calendar view">
    ${VIEWS.map((v) => html`<label><input type="radio" name="cal-view" value="${v}" ${v === view ? 'checked' : ''} /><span>${v[0].toUpperCase()}${v.slice(1)}</span></label>`)}
  </div>`;

const body = (state) => {
  const transit = findStrategy(state.strategy).transit;
  const plan = planTrip(state, transit);
  const events = eventsFor(state);
  const t = today();
  if (view === 'week') return weekView(mondayBefore(cursor), events, t);
  if (view === 'agenda') return agendaView(monthOf(cursor), events, t);
  return monthView(monthOf(cursor), transit, plan, events, t);
};

const legend = (state) => {
  const transit = findStrategy(state.strategy).transit;
  const plan = planTrip(state, transit);
  const n = inMonth(eventsFor(state), monthOf(cursor)).length;
  return html`
    ${['flight', 'do', 'deadline', 'doc', 'custom'].map((k) => html`<span class="evc ev-${k} is-tag">${icon(KINDS[k].icon)}<span>${KINDS[k].label}</span></span>`)}
    <span class="chip num">${plan.placed.size} picks · ${inr(plan.cost)} pp</span>
    <span class="sub">${n} on the calendar this month · tap anything for details</span>`;
};

const setView = (v, iso) => {
  if (v) view = v;
  if (iso) cursor = iso;
  writeHash();
  renderCalendar(store.get());
};

export function mountCalendar(s) {
  store = s;
  const root = $('#calendar');
  if (!root) return;
  parseHash();
  $('#cal-actions').innerHTML = html`
    <button class="btn" id="cal-add" type="button">${icon('plus')}Add event</button>
    <a class="btn" id="cal-ics" download="${ICS_NAME}" href="#">${icon('download')}.ics</a>`;
  root.addEventListener('click', (e) => {
    const t = e.target;
    const day = t.closest('[data-day]'); if (day) return document.dispatchEvent(new CustomEvent('day:open', { detail: Number(day.dataset.day) }));
    const ev = t.closest('[data-ev]'); if (ev) return openSheet({ mode: 'event', id: ev.dataset.ev });
    const add = t.closest('[data-new]'); if (add) return openSheet({ mode: 'form', id: null, iso: add.dataset.new });
    const date = t.closest('[data-date]'); if (date) return openSheet({ mode: 'day', iso: date.dataset.date });
    if (t.closest('#cal-add')) return openSheet({ mode: 'form', id: null, iso: cursor });
    const st = t.closest('[data-step]'); if (st) return setView(null, step(Number(st.dataset.step)));
    const j = t.closest('[data-jump]'); if (j) return setView(null, j.dataset.jump === 'today' ? today() : TRIP.start);
    return undefined;
  });
  root.addEventListener('change', (e) => {
    if (e.target.name === 'cal-view' && VIEWS.includes(e.target.value)) setView(e.target.value);
  });
  root.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select') || e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key === 'ArrowLeft') setView(null, step(-1));
    if (e.key === 'ArrowRight') setView(null, step(1));
  });
  window.addEventListener('hashchange', () => { parseHash(); renderCalendar(store.get()); });
  mountGcalPanel(store);
}

export function renderCalendar(state) {
  const grid = $('#cal-grid');
  if (!grid) return;
  $('#cal-toolbar').innerHTML = toolbar();
  grid.innerHTML = body(state);
  grid.dataset.view = view;
  grid.setAttribute('aria-label', `Calendar, ${label()}, ${view} view`);
  $('#cal-legend').innerHTML = legend(state);
  $('#cal-gcal').innerHTML = gcalPanel(state);
  if (icsUrl) URL.revokeObjectURL(icsUrl);
  icsUrl = URL.createObjectURL(new Blob([buildICS(state)], { type: 'text/calendar;charset=utf-8' }));
  $('#cal-ics').href = icsUrl;
}
