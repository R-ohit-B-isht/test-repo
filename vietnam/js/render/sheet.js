import { $, html } from '../dom.js';
import { icon } from '../icons.js';
import { PHOTOS } from '../data/photos.js';
import { isoOf } from '../data/trip.js';
import { eventsFor, findEvent, onDate, KINDS } from '../events.js';
import { slotsFor, recordOf, liveFiles, stageLabel } from '../vault/slots.js';
import { gcalLink } from '../export/gcal.js';
import { thumb } from './gallery.js';
import { linkChips } from './links.js';
import { clockOf } from './cal/chips.js';
import { fmtDate, toClock, toMins } from '../export/dates.js';

// Event sheet: the popup behind any calendar chip. Three faces — one event,
// one date (its list + add), or the add / edit form for your own event. Opens
// on `sheet:open` with { mode: 'event' | 'day' | 'form', id, iso }.

let ui = { mode: null, id: null, iso: null, lastFocus: null };
let store = null;

export const openSheet = (detail) => document.dispatchEvent(new CustomEvent('sheet:open', { detail }));

const longDate = (iso) => fmtDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const kindTag = (e) => html`<span class="evc ev-${e.kind} is-tag">${icon(KINDS[e.kind].icon)}<span>${KINDS[e.kind].label}</span></span>`;
const gcal = (e) => html`<a class="btn" href="${gcalLink(e)}" target="_blank" rel="noopener noreferrer">${icon('calendar')}Add to Google Calendar</a>`;

// The Manager record behind a leg / ticket / deadline: status and files.
const slotBlock = (state, id) => {
  const slot = slotsFor(state).find((s) => s.id === id);
  if (!slot) return '';
  const rec = recordOf(state, id);
  const n = liveFiles(rec).length;
  return html`
    <div class="sh-slot">
      <span class="chip ${rec.status === 'done' ? 'chip-sun' : ''}">${icon(rec.status === 'done' ? 'check' : 'clock')} ${stageLabel(slot, rec.status)}</span>
      ${rec.ref ? html`<span class="chip num">Ref ${rec.ref}</span>` : ''}
      <span class="chip">${icon('file')} ${n ? `${n} file${n > 1 ? 's' : ''}` : 'no file yet'}</span>
      <a class="btn btn-ghost" href="manager.html#slot-${id}">${icon('folder')}Open in Manager</a>
    </div>`;
};

const heroOf = (e) => {
  if (e.kind === 'day') { const p = PHOTOS[e.photo]; return html`<img class="sh-hero" src="assets/photos/${e.photo}.jpg" alt="" width="${p.w}" height="${p.h}" style="object-position: ${p.pos || '50% 50%'}" decoding="async" />`; }
  if (e.x) return thumb(e.x);
  return '';
};

const eventFace = (state, e) => html`
  <div class="card-head">
    <span class="row">${kindTag(e)}${e.done ? html`<span class="chip chip-sun">${icon('check')} done</span>` : ''}</span>
    <button class="btn-icon" type="button" data-close aria-label="Close">×</button>
  </div>
  ${heroOf(e)}
  <h3 class="h3" id="sheet-title">${e.title}</h3>
  <p class="sub">${longDate(e.iso)}${e.start != null ? ` · ${clockOf(e)}${e.tz === 'in' ? ' IST' : ''}` : ''}${e.where ? ` · ${e.where}` : ''}</p>
  ${e.sub ? html`<p class="sh-note">${e.sub}</p>` : ''}
  ${e.slot ? slotBlock(state, e.slot) : ''}
  ${e.kind === 'deadline' ? html`<div class="row">${linkChips(slotsFor(state).find((s) => s.id === e.slot)?.links || [])}</div>` : ''}
  <div class="sh-actions">
    ${e.dayN >= 1 ? html`<button class="btn" type="button" data-board="${e.dayN}">${icon('grid')}Open day board</button>` : ''}
    ${e.kind === 'deadline' ? html`<button class="btn" type="button" data-tick="${e.slot}">${icon(e.done ? 'undo' : 'check')}${e.done ? 'Not done yet' : 'Mark done'}</button>` : ''}
    ${e.kind === 'custom' ? html`<button class="btn" type="button" data-edit="${e.id}">${icon('sparkle')}Edit</button><button class="btn btn-ghost" type="button" data-remove="${e.id}">${icon('trash')}Remove</button>` : ''}
    ${e.kind === 'spend' ? html`<a class="btn" href="split.html">${icon('wallet')}Open in Split</a>` : gcal(e)}
  </div>`;

const dayFace = (state, iso) => {
  const evs = onDate(eventsFor(state), iso);
  return html`
    <div class="card-head">
      <span class="eyebrow">${longDate(iso)}</span>
      <button class="btn-icon" type="button" data-close aria-label="Close">×</button>
    </div>
    <h3 class="h3" id="sheet-title">${evs.length ? `${evs.length} on this day` : 'Free day'}</h3>
    <div class="sh-list">
      ${evs.map((e) => html`<button class="arow ev-${e.kind} ${e.done ? 'is-done' : ''}" type="button" data-ev="${e.id}"><span class="adot">${icon(e.icon)}</span><span class="atime num">${e.start == null ? 'all day' : clockOf(e)}</span><span class="atxt"><b>${e.title}</b></span></button>`)}
    </div>
    <div class="sh-actions"><button class="btn" type="button" data-new="${iso}">${icon('plus')}Add an event</button></div>`;
};

const formFace = (own, iso) => {
  const e = own || { title: '', iso, start: null, end: null, note: '', where: '' };
  const timed = e.start != null;
  return html`
    <form class="sh-form" id="sheet-form" data-id="${own?.id || ''}">
      <div class="card-head">
        <span class="eyebrow">${own ? 'Edit event' : 'New event'}</span>
        <button class="btn-icon" type="button" data-close aria-label="Close">×</button>
      </div>
      <label class="fld"><span>Title</span><input name="title" required maxlength="80" value="${e.title}" placeholder="Dinner with Minh" autocomplete="off" /></label>
      <div class="fld-row">
        <label class="fld"><span>Date</span><input name="iso" type="date" required value="${e.iso}" /></label>
        <label class="fld fld-check"><input name="allday" type="checkbox" ${timed ? '' : 'checked'} /><span>All day</span></label>
      </div>
      <div class="fld-row sh-times" ${timed ? '' : 'hidden'}>
        <label class="fld"><span>Start</span><input name="start" type="time" value="${timed ? toClock(e.start) : '19:00'}" /></label>
        <label class="fld"><span>End</span><input name="end" type="time" value="${e.end != null ? toClock(e.end) : '20:00'}" /></label>
      </div>
      <label class="fld"><span>Where</span><input name="where" maxlength="80" value="${e.where || ''}" placeholder="Optional" /></label>
      <label class="fld"><span>Note</span><textarea name="note" rows="2" maxlength="400" placeholder="Optional">${e.note || ''}</textarea></label>
      <div class="sh-actions">
        <button class="btn" type="submit">${icon('check')}${own ? 'Save' : 'Add'}</button>
        <button class="btn btn-ghost" type="button" data-close>Cancel</button>
      </div>
    </form>`;
};

const face = (state) => {
  if (ui.mode === 'form') return formFace(ui.id ? state.events.find((e) => e.id === ui.id) : null, ui.iso);
  if (ui.mode === 'day') return dayFace(state, ui.iso);
  const e = findEvent(eventsFor(state), ui.id);
  return e ? eventFace(state, e) : dayFace(state, ui.iso || isoOf(1));
};

const setOpen = (root, on) => {
  root.dataset.open = String(on);
  root.setAttribute('aria-hidden', String(!on));
  document.body.classList.toggle('is-locked', on);
};

const readForm = (form) => {
  const f = new FormData(form);
  const allday = f.get('allday') === 'on';
  const start = allday ? null : toMins(f.get('start'));
  const endRaw = allday ? null : toMins(f.get('end'));
  const end = start == null ? null : Math.max(endRaw ?? start + 60, start + 15);
  return { title: String(f.get('title')).trim(), iso: f.get('iso'), start, end, where: String(f.get('where')).trim(), note: String(f.get('note')).trim() };
};

const newId = () => `ev-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function mountSheet(s) {
  store = s;
  const root = $('#sheet');
  if (!root) return;
  const card = $('.card', root);
  const close = () => { setOpen(root, false); ui = { ...ui, mode: null }; ui.lastFocus?.focus(); ui.lastFocus = null; };
  const show = (next) => {
    if (!ui.mode) ui.lastFocus = document.activeElement;
    ui = { ...ui, ...next };
    setOpen(root, true);
    renderSheet(store.get());
    card.scrollTop = 0;
    ($('input[name=title]', root) || $('[data-close]', root))?.focus();
  };
  document.addEventListener('sheet:open', (e) => show(e.detail));
  root.addEventListener('click', (e) => {
    if (e.target === root || e.target.closest('[data-close]')) return close();
    const t = e.target;
    const ev = t.closest('[data-ev]'); if (ev) return show({ mode: 'event', id: ev.dataset.ev });
    const add = t.closest('[data-new]'); if (add) return show({ mode: 'form', id: null, iso: add.dataset.new });
    const edit = t.closest('[data-edit]'); if (edit) return show({ mode: 'form', id: edit.dataset.edit });
    const board = t.closest('[data-board]'); if (board) { close(); return document.dispatchEvent(new CustomEvent('day:open', { detail: Number(board.dataset.board) })); }
    const tick = t.closest('[data-tick]'); if (tick) { store.toggleCheck(tick.dataset.tick); return renderSheet(store.get()); }
    const rm = t.closest('[data-remove]');
    if (rm) { const iso = store.get().events.find((x) => x.id === rm.dataset.remove)?.iso; store.setEvent(rm.dataset.remove, { deleted: true, deletedAt: Date.now() }); document.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Event removed', undo: () => store.setEvent(rm.dataset.remove, { deleted: false }) } })); return show({ mode: 'day', iso }); }
    return undefined;
  });
  root.addEventListener('change', (e) => {
    if (e.target.name === 'allday') $('.sh-times', root).hidden = e.target.checked;
  });
  root.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target.closest('#sheet-form');
    if (!form) return;
    const data = readForm(form);
    if (!data.title || !data.iso) return;
    if (form.dataset.id) { store.setEvent(form.dataset.id, data); return show({ mode: 'event', id: form.dataset.id }); }
    const id = newId();
    store.addEvent({ id, ...data, created: Date.now() });
    show({ mode: 'event', id });
  });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

export function renderSheet(state) {
  const root = $('#sheet');
  if (!root || root.dataset.open !== 'true') return;
  $('.card', root).innerHTML = face(state);
}
