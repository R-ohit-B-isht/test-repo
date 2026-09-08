import { html } from '../../dom.js';
import { addDays, dayOf, parseISO } from '../../export/dates.js';
import { onDate } from '../../events.js';
import { chip } from './chips.js';
import { WD } from './month.js';

// Week view: seven columns, an all-day strip on top, then an hour grid from
// 06:00 to midnight with timed events placed by their minutes. Times are the
// planner's (Vietnam), so the Delhi departure sits on its Indian clock time.

export const DAY_START = 6 * 60;
export const DAY_END = 24 * 60;
export const PX_PER_HOUR = 48;
const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 }, (_, i) => DAY_START + i * 60);

const top = (m) => ((Math.max(m, DAY_START) - DAY_START) / 60) * PX_PER_HOUR;
const height = (e) => Math.max(22, ((Math.min(e.end ?? e.start + 60, DAY_END) - Math.max(e.start, DAY_START)) / 60) * PX_PER_HOUR);

// Two timed events that overlap share the column side by side.
const lanes = (evs) => {
  const out = [];
  for (const e of evs) {
    const clash = out.filter((o) => o.e.start < (e.end ?? e.start + 60) && e.start < (o.e.end ?? o.e.start + 60));
    const used = new Set(clash.map((o) => o.lane));
    let lane = 0;
    while (used.has(lane)) lane += 1;
    out.push({ e, lane, of: 1 });
    for (const o of clash) o.of = Math.max(o.of, lane + 1);
    out[out.length - 1].of = Math.max(...clash.map((o) => o.of), lane + 1);
  }
  return out;
};

const timed = (e, lane, of) => html`
  <button class="evb ev-${e.kind}" type="button" data-ev="${e.id}" title="${e.title}"
    style="top: ${top(e.start)}px; height: ${height(e)}px; left: ${(lane / of) * 100}%; width: ${100 / of}%">
    <b>${e.title}</b>${height(e) > 34 ? html`<span>${e.sub || e.where || ''}</span>` : ''}
  </button>`;

const head = (iso, today) => {
  const n = dayOf(iso);
  const d = parseISO(iso);
  const act = n >= 1 ? html`data-day="${n}"` : html`data-date="${iso}"`;
  return html`
    <button class="wday ${iso === today ? 'is-today' : ''} ${n >= 1 ? 'is-trip' : ''}" type="button" ${act} aria-label="${d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}">
      <span>${WD[(d.getDay() + 6) % 7]}</span><b class="num">${d.getDate()}</b>${n != null ? html`<em>D${n}</em>` : ''}
    </button>`;
};

export const weekView = (monday, events, today) => {
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const byDay = days.map((iso) => onDate(events, iso));
  return html`
    <div class="week" style="--h: ${PX_PER_HOUR}px">
      <div class="wcorner"></div>
      ${days.map((iso) => head(iso, today))}
      <div class="wlabel">all day</div>
      ${byDay.map((evs) => html`<div class="wall">${evs.filter((e) => e.start == null).map((e) => chip(e))}</div>`)}
      <div class="wgutter">${HOURS.map((m) => html`<span class="num">${String(m / 60).padStart(2, '0')}</span>`)}</div>
      ${byDay.map((evs) => html`
        <div class="wcol" style="height: ${HOURS.length * PX_PER_HOUR}px">
          ${lanes(evs.filter((e) => e.start != null && e.start < DAY_END)).map(({ e, lane, of }) => timed(e, lane, of))}
        </div>`)}
    </div>`;
};
