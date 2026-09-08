import { html } from '../../dom.js';
import { icon } from '../../icons.js';
import { isoOf } from '../../data/trip.js';
import { DAYS } from '../../data/days.js';
import { PHOTOS } from '../../data/photos.js';
import { dayOf, parseISO } from '../../export/dates.js';
import { inMonth } from '../../events.js';
import { clockOf } from './chips.js';

// Agenda: the month as a list, one block per date that has anything on it,
// like Google Calendar's Schedule view. A photo banner tops months that hold
// trip days; empty months say so and offer the add button.

const banner = (ym) => {
  const day = DAYS.find((d) => isoOf(d.n).startsWith(ym));
  if (!day) return '';
  const photo = PHOTOS[day.photo];
  return html`
    <div class="abanner">
      <img src="assets/photos/${day.photo}.jpg" alt="" width="${photo.w}" height="${photo.h}" loading="lazy" decoding="async" style="object-position: ${photo.pos || '50% 50%'}" />
      <span class="eyebrow">Trip month</span>
    </div>`;
};

const row = (e) => html`
  <button class="arow ev-${e.kind} ${e.done ? 'is-done' : ''}" type="button" data-ev="${e.id}">
    <span class="adot">${icon(e.icon)}</span>
    <span class="atime num">${e.start == null ? 'all day' : clockOf(e)}</span>
    <span class="atxt"><b>${e.title}</b>${e.sub || e.where ? html`<span class="sub">${e.where && e.sub ? `${e.where} · ${e.sub}` : e.sub || e.where}</span>` : ''}</span>
  </button>`;

const dateHead = (iso, today) => {
  const d = parseISO(iso);
  const n = dayOf(iso);
  return html`
    <div class="adate ${iso === today ? 'is-today' : ''}">
      <span>${d.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
      <b class="num">${d.getDate()}</b>
      ${n >= 1 ? html`<button class="dpill" type="button" data-day="${n}" aria-label="Open day ${n} board">D${n}</button>` : ''}
    </div>`;
};

export const agendaView = (ym, events, today) => {
  const evs = inMonth(events, ym);
  const dates = [...new Set(evs.map((e) => e.iso))];
  if (!dates.length) {
    return html`
      <div class="aempty">
        ${icon('calendar')}
        <b>Nothing this month.</b>
        <span class="sub">Add your own event or jump to the trip.</span>
        <span class="row"><button class="btn" type="button" data-new="${ym}-01">${icon('plus')}Add event</button><button class="btn" type="button" data-jump="trip">Trip month</button></span>
      </div>`;
  }
  return html`
    ${banner(ym)}
    ${dates.map((iso) => html`
      <div class="aday">
        ${dateHead(iso, today)}
        <div class="alist">${evs.filter((e) => e.iso === iso).map(row)}<button class="aadd" type="button" data-new="${iso}" aria-label="Add an event on ${iso}">${icon('plus')}</button></div>
      </div>`)}`;
};
