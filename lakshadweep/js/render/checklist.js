import { CHECKLIST, TRIP } from '../data/trip.js';
import { SOURCES } from '../data/sources.js';
import { html, raw, $, $$, fmtDate, daysBetween } from '../dom.js';

function checkItem(c) {
  const src = c.link ? SOURCES[c.link] : null;
  const lead = daysBetween(c.due, TRIP.start);
  return html`
    <li>
      <label class="check">
        <input type="checkbox" data-check="${c.id}" />
        <span class="check__body">
          <span class="check__due">by <strong>${fmtDate(c.due)}</strong><span>${lead} days out</span></span>
          <span class="check__text">${c.text}${src ? raw(html` <a href="${src.url}" target="_blank" rel="noopener">↗ ${src.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>`) : ''}</span>
        </span>
      </label>
    </li>`;
}

export function mountChecklist(store) {
  $('#checklist').innerHTML = CHECKLIST.map(checkItem).join('');
  $('#checklist').addEventListener('change', (e) => {
    const box = e.target.closest('[data-check]');
    if (!box) return;
    store.set((s) => ({ checked: { ...s.checked, [box.dataset.check]: box.checked } }));
  });
}

export function renderChecklist(state) {
  const boxes = $$('[data-check]');
  boxes.forEach((box) => { box.checked = Boolean(state.checked[box.dataset.check]); });
  const done = boxes.filter((b) => b.checked).length;
  const out = $('#checklist-done');
  if (done === boxes.length) {
    out.textContent = 'Everything is booked. Pack the shawl — the ship leaves at dusk.';
    out.classList.add('is-in');
  } else if (done > 0) {
    out.textContent = `${done} of ${boxes.length} done. ${boxes.length - done} to go.`;
    out.classList.add('is-in');
  } else {
    out.classList.remove('is-in');
  }
}
