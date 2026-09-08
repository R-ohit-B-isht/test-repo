// Section 05: booking steps filtered by strategy, dated back from departure,
// with a progress ring. Checked state lives in the store.
import { CHECKLIST, TRIP } from '../data/trip.js';
import { SOURCES } from '../data/sources.js';
import { addDays } from '../plan.js';
import { html, raw, $, $$, fmtDate } from '../dom.js';
import { icon } from '../icons.js';

const host = (url) => url.replace(/^https?:\/\//, '').split('/')[0];
const R = 52;
const CIRC = 2 * Math.PI * R;

function stepItem(c, i) {
  const src = c.link ? SOURCES[c.link] : null;
  const due = addDays(TRIP.start, -c.before);
  return html`
    <li class="step" style="--i:${i}">
      <label class="check">
        <input type="checkbox" data-check="${c.id}" />
        <span class="check__mark" aria-hidden="true">${raw(icon('check'))}</span>
        <span class="check__n" aria-hidden="true">${i + 1}</span>
        <span class="check__text">${c.text}</span>
        <span class="check__due"><time datetime="${due}">${fmtDate(due)}</time><small>${c.before} d before</small></span>
        <span class="check__meta">${raw(icon(c.icon))}${src ? raw(html`<a class="src" href="${src.url}" target="_blank" rel="noopener">${host(src.url)}${raw(icon('external'))}</a>`) : ''}</span>
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
  const all = boxes.length;
  const pct = all ? done / all : 0;
  const first = boxes.find((b) => !b.checked);
  const next = first ? $('.check__text', first.closest('.step')).textContent : '';
  $('#checklist-done').innerHTML = html`
    <div class="ring" role="img" aria-label="${done} of ${all} booked">
      <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="track" cx="60" cy="60" r="${R}"/><circle class="fill" cx="60" cy="60" r="${R}" stroke-dasharray="${CIRC.toFixed(1)}" stroke-dashoffset="${(CIRC * (1 - pct)).toFixed(1)}"/></svg>
      <b>${done}<small>/${all}</small></b>
    </div>
    <p>${done === all ? raw(html`<strong>All booked.</strong> Pack the shawl; the ship leaves at dusk.`) : raw(html`Next: <strong>${next}</strong>`)}</p>`;
}
