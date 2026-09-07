import { $, html } from '../dom.js';
import { icon } from '../icons.js';
import { SOURCES } from '../data/sources.js';
import { CREDITS, TRIP, FX } from '../data/trip.js';
import { PHOTOS } from '../data/photos.js';

// Receipts: every source as a card, photo credits, design credits, footer.

const source = ([id, s]) => html`
  <a class="source" id="src-${id}" href="${s.url}" target="_blank" rel="noopener">
    <b>${icon('link')} ${s.name}</b>
    <span>${s.note}</span>
  </a>`;

const photoCredit = ([key, p]) => html`<a class="chip" href="${p.page}" target="_blank" rel="noopener" title="${p.alt}">${key} · ${p.credit} · ${p.license}</a>`;

export function renderSources() {
  $('#source-list').innerHTML = Object.entries(SOURCES).map(source).join('');
  $('#credits').innerHTML = html`
    ${Object.entries(PHOTOS).map(photoCredit)}
    ${CREDITS.map((c) => html`<span class="chip chip-ink" title="${c.took}">${c.name}</span>`)}
    <a class="chip" href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">map · Natural Earth · public domain</a>`;
  $('#footer').innerHTML = html`
    <span>${icon('info')} Flights: ${TRIP.observedWindow}. Taxes in, checked bags out, not live seats. Food and beds are listed prices, not bookings.</span>
    <span>1 USD ≈ ₹${FX.inrPerUsd} · ₹1 ≈ ${FX.vndPerInr} ₫</span>
    <span>Fares are for these exact dates. Move the trip, re-check the flights.</span>`;
}
