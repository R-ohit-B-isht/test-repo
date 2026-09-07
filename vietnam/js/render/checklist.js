import { $, $$, html } from '../dom.js';
import { icon } from '../icons.js';
import { TRIP } from '../data/trip.js';
import { stepsFor } from '../data/checklist.js';
import { PRICES } from '../data/prices.js';
import { findStrategy } from '../strategies.js';

// Booking order with "by when" dates, and the end state: a ring that fills
// and a lantern that lights when every step is ticked (peak-end).

const byWhen = (lead) => {
  const d = new Date(`${TRIP.start}T00:00:00`);
  d.setDate(d.getDate() - lead);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const step = (c, done) => html`
  <button class="step" type="button" data-check="${c.id}" aria-pressed="${done ? 'true' : 'false'}">
    <span class="box">${icon('check')}</span>
    <span class="txt"><b>${c.title}</b><span>${c.hint}</span></span>
    <span class="when">by ${byWhen(c.lead)}</span>
  </button>`;

const R = 52; const C = 2 * Math.PI * R;

const ring = (done, total) => html`
  <svg class="ring" viewBox="0 0 120 120" role="img" aria-label="${done} of ${total} booked">
    <circle class="track" cx="60" cy="60" r="${R}"/>
    <circle class="fill" cx="60" cy="60" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - done / total)}"/>
    <text x="60" y="68" text-anchor="middle">${done}/${total}</text>
  </svg>`;

export function mountChecklist(store) {
  $('#steps').addEventListener('click', (e) => { const b = e.target.closest('[data-check]'); if (b) store.toggleCheck(b.dataset.check); });
}

const flightDates = (state) => {
  const planes = findStrategy(state.strategy).legs(PRICES, state).filter((l) => l.mode === 'plane' && l.price.date);
  if (!planes.length) return '';
  const first = planes[0].price;
  if (first.range === 'return fare') return `Return ticket, ${first.date}`;
  return `Out ${first.date}, home ${planes[planes.length - 1].price.date}`;
};

export function renderChecklist(state) {
  const steps = stepsFor(state.strategy);
  $('#date-chip').innerHTML = html`${icon('plane')} ${flightDates(state)}`;
  const done = steps.filter((c) => state.checklist[c.id]).length;
  const host = $('#steps');
  const ids = steps.map((c) => c.id).join();
  if (host.dataset.ids !== ids) { host.innerHTML = steps.map((c) => step(c, false)).join(''); host.dataset.ids = ids; }
  $$('[data-check]', host).forEach((el) => el.setAttribute('aria-pressed', String(!!state.checklist[el.dataset.check])));
  const all = done === steps.length;
  $('#done').innerHTML = html`
    ${all ? html`<div class="lantern-glow">${icon('lantern')}</div>` : ring(done, steps.length)}
    <h3>${all ? 'Packed. Go.' : done ? `${steps.length - done} to go` : 'Flights first'}</h3>
    <p class="muted" style="margin-top:8px">${all ? 'Xin chào, Hà Nội.' : 'Tick things off as you book. Saved on this device.'}</p>`;
}
