import { html } from '../../dom.js';
import { icon } from '../../icons.js';
import { toClock } from '../../export/dates.js';

// Event chips shared by month, week and agenda views. One family: colour by
// kind (`ev-<kind>`), icon, optional clock, text that ellipsises rather than
// wraps. Every chip is a button carrying `data-ev` — tap → event sheet.

export const clockOf = (e) => (e.start == null ? '' : e.end ? `${toClock(e.start)}–${toClock(e.end)}` : toClock(e.start));

export const chip = (e, { time = false, cls = '' } = {}) => html`
  <button class="evc ev-${e.kind} ${cls} ${e.done ? 'is-done' : ''}" type="button" data-ev="${e.id}" title="${e.title}">
    ${icon(e.icon)}${time && e.start != null ? html`<time class="num">${toClock(e.start)}</time>` : ''}<span>${e.title}</span>
  </button>`;

export const more = (n, iso) => html`<button class="evc ev-more" type="button" data-date="${iso}">+${n} more</button>`;
