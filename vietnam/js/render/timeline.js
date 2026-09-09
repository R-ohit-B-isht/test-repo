import { html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { inrFromVnd, inrFromUsd } from '../data/trip.js';
import { timelineFor, clock } from '../timeline.js';

// Hour-by-hour rail for one day (timeline.js output). Each row is a time
// range, an icon and a label; picks show their price, transit rows are quiet,
// warnings turn the row amber. Assumptions and conflicts sit under the rail.

const ICON = { eat: 'bowl', do: 'sparkle', hop: 'walk', free: 'clock', sleep: 'moon' };

const price = (r) => {
  const x = r.x;
  if (!x || x.free || x.food) return '';
  const v = x.vnd ? inrFromVnd(x.vnd) : x.usd ? inrFromUsd(x.usd) : null;
  return v ? html`<span class="amt num">≈${inr(v)}</span>` : '';
};

const rowView = (r) => html`
  <li class="trow trow-${r.kind} ${r.late ? 'is-late' : ''} ${r.inside ? 'is-inside' : ''} ${r.empty ? 'is-empty' : ''}">
    <span class="tt num">${clock(r.start)}<em>${clock(r.end)}</em></span>
    <span class="tdot"><span class="ic-wrap">${icon(r.icon || ICON[r.kind] || 'pin')}</span></span>
    <span class="tl">
      <b>${r.label}</b>
      ${r.inside ? html`<span class="sub">${r.inside}</span>` : ''}
      ${r.see ? html`<span class="sub">${r.see.map((x) => x.name).join(' · ')}</span>` : ''}
      ${r.late ? html`<span class="sub warn">${icon('info')} runs late</span>` : ''}
    </span>
    ${price(r)}
  </li>`;

export const timelineView = (day, planned, transit) => {
  const { rows, notes } = timelineFor(day, planned, transit);
  const [assume, ...warns] = notes;
  return html`
    <div class="timeline">
      <ol class="trail">${rows.map(rowView)}</ol>
      ${warns.length ? html`<ul class="twarn">${warns.map((w) => html`<li>${icon('info')}${w}</li>`)}</ul>` : ''}
      <p class="sub tnote">${assume}. Times are estimates from opening hours and durations, not bookings.</p>
    </div>`;
};
