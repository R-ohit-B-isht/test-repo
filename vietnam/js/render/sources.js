import { $, html } from '../dom.js';
import { icon } from '../icons.js';
import { SOURCES } from '../data/sources.js';
import { CREDITS, TRIP, FX } from '../data/trip.js';
import { PHOTOS } from '../data/photos.js';
import { PICS } from '../data/pics.js';
import { BY_ID } from '../data/activities.js';

// Receipts: every source as a card, photo credits, design credits, footer.

const source = ([id, s]) => html`
  <a class="source" id="src-${id}" href="${s.url}" target="_blank" rel="noopener">
    <b>${icon('link')} ${s.name}</b>
    <span>${s.note}</span>
  </a>`;

const photoCredit = ([key, p]) => html`<a class="chip" href="${p.page}" target="_blank" rel="noopener" title="${p.alt}">${key} · ${p.credit} · ${p.license}</a>`;

// Activity photos: Wikimedia Commons, one credit line per file, folded away.
const picCredits = () => {
  const rows = Object.entries(PICS).flatMap(([id, list]) => list.map((im) => ({ name: BY_ID[id]?.name || id, ...im })));
  return html`
    <details class="pic-credits">
      <summary class="chip">${rows.length} place photos · Wikimedia Commons</summary>
      <div class="credits">${rows.map((r) => html`<a class="chip" href="${r.page}" target="_blank" rel="noopener" title="${r.alt}">${r.name} · ${r.by} · ${r.lic}</a>`)}</div>
    </details>`;
};

export function renderSources() {
  $('#source-list').innerHTML = Object.entries(SOURCES).map(source).join('');
  $('#credits').innerHTML = html`
    ${Object.entries(PHOTOS).map(photoCredit)}
    ${CREDITS.map((c) => html`<span class="chip chip-ink" title="${c.took}">${c.name}</span>`)}
    <a class="chip" href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">map · Natural Earth · public domain</a>
    ${picCredits()}`;
}

export function renderFooter() {
  $('#footer').innerHTML = html`
    <span>${icon('info')} Flights: ${TRIP.observedWindow}. Taxes in, checked bags out, not live seats. Food and beds are listed prices, not bookings.</span>
    <span>1 USD ≈ ₹${FX.inrPerUsd} · ₹1 ≈ ${FX.vndPerInr} ₫</span>
    <span>Fares are for these exact dates. Move the trip, re-check the flights.</span>`;
}
