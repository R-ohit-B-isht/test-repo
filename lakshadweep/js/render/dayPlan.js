// The body of a day card: a photo-led "Do" list (logistics, then picks with a
// thumbnail, AM/PM/EVE badge and price), a Nearby chip row for the strolls that
// ride along, and "More around here" chips that tick an unpicked item in place.
import { PRICES } from '../data/prices.js';
import { REACH, PACKAGE_FREE, WHEN, isExtra, extraTag } from '../data/catalogue.js';
import { itemPhotos } from '../data/photos.js';
import { openings } from '../grouping.js';
import { fmt } from '../budget.js';
import { html, raw } from '../dom.js';
import { icon } from '../icons.js';

export function pickTag(item, day) {
  if (day.pkg && item.key && PACKAGE_FREE.has(item.key)) return 'in package';
  if (item.reach !== 'base') return REACH[item.reach].label;
  if (!item.key) return 'free';
  const p = PRICES[item.key];
  return p.status === 'unavailable' ? 'quote' : fmt(p.amount);
}

const when = (item) => (item.when ? html`<i class="dp__when">${WHEN[item.when].short}</i>` : '');

function thumb(item) {
  const [p] = itemPhotos(item.id);
  if (!p) return html`<span class="dp__ic">${raw(icon(item.icon))}</span>`;
  return html`<button type="button" class="dp__thumb" data-gallery="${item.id}" aria-label="Photos of ${item.name}"><img src="${p.src}" alt="" width="40" height="40" loading="lazy" decoding="async"></button>`;
}

const fixedRow = (f) => html`<li class="dp dp--fixed">${raw(icon(f.ic))}<span>${f.t}</span></li>`;

const pickRow = (p, day) => html`
      <li class="dp dp--pick">${raw(thumb(p))}<span>${raw(when(p))}${p.name}</span><small>${pickTag(p, day)}</small></li>`;

export function doList(day) {
  const majors = day.picks.filter((p) => !isExtra(p));
  const rows = [...day.fixed.map(fixedRow), ...majors.map((p) => pickRow(p, day))];
  if (!majors.length && !day.fixed.length) rows.push(html`<li class="dp dp--free">${raw(icon('sun'))}<span>Nothing booked — a free day</span></li>`);
  return rows.join('');
}

const nearChip = (p) => html`<li><span class="near" title="${extraTag(p)}">${raw(icon(p.icon))}${p.name}</span></li>`;
const addChip = (c) => html`<li><button type="button" class="near near--add" data-add="${c.id}" title="${c.hint}" aria-label="Add ${c.name} to this day">${raw(icon('plus'))}${c.name}${c.key && PRICES[c.key].status !== 'unavailable' ? raw(html`<b>${fmt(PRICES[c.key].amount)}</b>`) : ''}</button></li>`;

export function nearby(day, picks) {
  const extras = day.picks.filter(isExtra);
  const more = openings(day, picks);
  if (!extras.length && !more.length) return '';
  return html`${extras.length ? raw(html`<li class="near-label">Nearby</li>`) : ''}${raw(extras.map(nearChip).join(''))}${more.length ? raw(html`<li class="near-label near-label--add">Add</li>`) : ''}${raw(more.map(addChip).join(''))}`;
}
