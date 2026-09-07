// Section 04: booking steps filtered by strategy, dated back from departure.
import { CHECKLIST, TRIP } from '../data/trip.js';
import { SOURCES } from '../data/sources.js';
import { addDays } from '../plan.js';
import { html, raw, $, $$, fmtDate } from '../dom.js';
import { icon } from '../icons.js';

const host = (url) => url.replace(/^https?:\/\//, '').split('/')[0];

function stepItem(c, i) {
  const src = c.link ? SOURCES[c.link] : null;
  const due = addDays(TRIP.start, -c.before);
  return html`
    <li class="step" style="--i:${i}">
      <label class="check">
        <input type="checkbox" data-check="${c.id}" />
        <span class="check__mark" aria-hidden="true">${raw(icon('check'))}</span>
        <span class="check__ic">${raw(icon(c.icon))}</span>
        <span class="check__body">
          <span class="check__due"><time datetime="${due}">${fmtDate(due)}</time><small>${c.before} d before</small></span>
          <span class="check__text">${c.text}</span>
          ${src ? raw(html`<a class="check__link" href="${src.url}" target="_blank" rel="noopener">${host(src.url)} ↗</a>`) : ''}
        </span>
      </label>
    </li>`;
}

export function mountChecklist(store) {
  $('#checklist').addEventListener('change', (e) => {
    const box = e.target.closest('[data-check]');
    if (!box) return;
    store.set((s) => ({ checked: { ...s.checked, [box.dataset.check]: box.checked } }));
  });
}

let key = '';

export function renderChecklist(state) {
  if (key !== state.strategy) {
    key = state.strategy;
    const steps = CHECKLIST.filter((c) => !c.for || c.for.includes(state.strategy));
    $('#checklist').innerHTML = steps.map(stepItem).join('');
  }
  const boxes = $$('[data-check]');
  boxes.forEach((box) => {
    box.checked = Boolean(state.checked[box.dataset.check]);
    box.closest('.step').classList.toggle('is-done', box.checked);
  });
  const done = boxes.filter((b) => b.checked).length;
  const out = $('#checklist-done');
  out.textContent = done === boxes.length
    ? 'All booked. Pack the shawl; the ship leaves at dusk.'
    : done ? `${done} of ${boxes.length} booked` : '';
  out.classList.toggle('is-in', done > 0);
}
