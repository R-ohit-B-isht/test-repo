import { $, $$, html } from '../dom.js';
import { icon } from '../icons.js';
import { TRIP } from '../data/trip.js';
import { stepsFor } from '../data/checklist.js';
import { PRICES } from '../data/prices.js';
import { findStrategy } from '../strategies.js';
import { stepLinks, stays } from '../book.js';
import { fmtDate } from '../export/dates.js';
import { linkChips } from './links.js';

// Booking order with "by when" dates and provider links per step, the stays
// you need to book, and the end state: a ring that fills and a lantern that
// lights when every step is ticked (peak-end).

const byWhen = (lead) => {
  const d = new Date(`${TRIP.start}T00:00:00`);
  d.setDate(d.getDate() - lead);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const step = (c, links) => html`
  <div class="step" data-step="${c.id}">
    <button class="tick" type="button" data-check="${c.id}" aria-pressed="false" aria-label="Done: ${c.title}">
      <span class="box">${icon('check')}</span>
    </button>
    <div class="txt">
      <b>${c.title}</b><span>${c.hint}</span>
      ${links.length ? html`<div class="links">${linkChips(links)}</div>` : ''}
    </div>
    <span class="when">by ${byWhen(c.lead)}</span>
  </div>`;

const R = 52; const C = 2 * Math.PI * R;

const ring = (done, total) => html`
  <svg class="ring" viewBox="0 0 120 120" role="img" aria-label="${done} of ${total} booked">
    <circle class="track" cx="60" cy="60" r="${R}"/>
    <circle class="fill" cx="60" cy="60" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - done / total)}"/>
    <text x="60" y="68" text-anchor="middle">${done}/${total}</text>
  </svg>`;

const stayRow = (r) => html`
  <li>
    <span class="ic-wrap">${icon('bed')}</span>
    <div>
      <b>${r.name}</b>
      <span class="muted">${r.city} · ${r.nights} night${r.nights > 1 ? 's' : ''} · ${fmtDate(r.from)} → ${fmtDate(r.to)}</span>
      <div class="links">${linkChips(r.links)}</div>
    </div>
  </li>`;

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
  const key = `${state.strategy}:${state.travellers}`;
  if (host.dataset.key !== key) { host.innerHTML = steps.map((c) => step(c, stepLinks(c, state))).join(''); host.dataset.key = key; }
  $$('[data-step]', host).forEach((el) => {
    const on = !!state.checklist[el.dataset.step];
    el.classList.toggle('is-done', on);
    $('[data-check]', el).setAttribute('aria-pressed', String(on));
  });
  const all = done === steps.length;
  $('#done').innerHTML = html`
    ${all ? html`<div class="lantern-glow">${icon('lantern')}</div>` : ring(done, steps.length)}
    <h3>${all ? 'Packed. Go.' : done ? `${steps.length - done} to go` : 'Flights first'}</h3>
    <p class="muted" style="margin-top:8px">${all ? 'Xin chào, Hà Nội.' : 'Tick things off as you book. Saved on this device.'}</p>`;
  const beds = $('#stays');
  if (beds) beds.innerHTML = html`<h3>Beds · ${state.travellers} ${state.travellers > 1 ? 'people' : 'person'}</h3><ul class="stay-list">${stays(state).map(stayRow)}</ul>`;
}
