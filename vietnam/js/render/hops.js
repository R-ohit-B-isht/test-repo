import { $, html, inr } from '../dom.js';
import { icon } from '../icons.js';
import { HOPS, wayOf, wayPrice, wayInr, hhmm } from '../data/hops.js';
import { PRICES, KIND_LABEL } from '../data/prices.js';
import { SOURCES } from '../data/sources.js';
import { isoOf } from '../data/trip.js';
import { STRATEGIES } from '../strategies.js';
import { wayLinks } from '../book.js';

// Ways to do each hop (Rome2Rio's compare card, 12Go's date-locked links).
// One strip per hop, one tile per way: mode, time bar, ₹ per person, how the
// price is known. Tapping a tile is the choice — the leg in the budget, the
// day's fixed slot and the itinerary all follow. Tour-covered hops compare only.

const dateOf = (day) => new Date(`${isoOf(day)}T00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

const kindPill = (pr) => {
  const s = SOURCES[pr.source];
  return html`<a class="src" href="${s.url}" target="_blank" rel="noopener" title="${s.name}: ${pr.range}">${KIND_LABEL[pr.kind]} ${icon('link')}</a>`;
};

const priceCell = (w, state, included) => {
  const pr = wayPrice(w, PRICES, state);
  if (!pr) return html`<span class="hop-amt num ${included ? '' : 'muted'}">${included ? 'incl.' : 'needs the tour on'}</span>`;
  const pp = wayInr(w, PRICES, state);
  return html`<span class="hop-amt num">${inr(pp)}${pr.perGroup ? html`<small> pp · ${inr(pr.amount)} car</small>` : ''}${kindPill(pr)}</span>`;
};

const strategyFor = (w, state) => (w.id === 'train' && state.strategy === 'roundtrip' ? 'roundtrip' : STRATEGIES.find((s) => s.transit === w.id && s.id !== 'roundtrip')?.id || state.strategy);

const chosenId = (hop, state) => (hop.strategy ? STRATEGIES.find((s) => s.id === state.strategy)?.transit : wayOf(hop, state.hops).id);

const tile = (hop, w, state, longest) => {
  const compareOnly = !!hop.info;
  const included = compareOnly && !w.price && !!state.picks[hop.info];
  const on = compareOnly ? included : chosenId(hop, state) === w.id;
  const pct = Math.max(12, Math.round((w.min / longest) * 100));
  const links = wayLinks(hop, w, state);
  const body = html`
    <span class="hop-mode">${icon(w.mode)}</span>
    <span class="hop-name">${w.name}</span>
    <span class="hop-bar" aria-hidden="true"><i style="width:${pct}%"></i></span>
    <span class="hop-meta"><span class="hop-time num">${hhmm(w.min)}</span>${priceCell(w, state, included)}</span>
    <span class="hop-note">${w.note}</span>`;
  return html`
    <div class="hop-way ${on ? 'on' : ''} ${compareOnly ? 'cmp' : ''}">
      ${compareOnly
        ? html`<div class="hop-tile" data-way="${w.id}">${body}</div>`
        : html`<button type="button" class="hop-tile" data-hop="${hop.id}" data-way="${w.id}" aria-pressed="${on}" aria-label="${w.name}, ${hhmm(w.min)}${on ? ', chosen' : ''}">${body}</button>`}
      <span class="hop-links">${links.map((l) => html`<a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.name}${icon('link')}</a>`)}</span>
    </div>`;
};

const strip = (hop, state) => {
  const longest = Math.max(...hop.ways.map((w) => w.min));
  return html`
    <div class="hop" id="hop-${hop.id}">
      <div class="hop-head">
        <span class="chip chip-ink num">D${hop.day}</span>
        <b>${hop.from} → ${hop.to}</b>
        <span class="muted small num">${dateOf(hop.day)} · ${hop.km} km${hop.info ? ' · compare only' : ''}</span>
      </div>
      <div class="hop-ways">${hop.ways.map((w) => tile(hop, w, state, longest))}</div>
    </div>`;
};

export const hopsCard = (state) => html`
  <div class="fare-top">
    <div><span class="eyebrow">Ways to get there</span><h3 class="h3">Tap a way, the plan follows</h3></div>
    <span class="small muted">Times door to door · ₹ per person · car fares split by ${state.travellers}</span>
  </div>
  ${HOPS.map((h) => strip(h, state))}`;

export function mountHops(store) {
  const root = $('#hops');
  // Day board's "other ways" link lands here; the strip is rendered after the browser's own hash jump.
  if (location.hash.startsWith('#hop-')) requestAnimationFrame(() => $(location.hash, root)?.scrollIntoView({ block: 'center' }));
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-hop]');
    if (!b) return;
    const hop = HOPS.find((h) => h.id === b.dataset.hop);
    const w = hop.ways.find((x) => x.id === b.dataset.way);
    const state = store.get();
    if (hop.strategy) store.set({ strategy: strategyFor(w, state) });
    else store.set({ hops: { ...state.hops, [hop.id]: w.id } });
  });
}

export const renderHops = (state) => {
  const el = $('#hops');
  if (!el) return;
  const had = el.contains(document.activeElement) ? document.activeElement.dataset : null;
  el.innerHTML = hopsCard(state);
  if (had?.hop) $(`[data-hop="${had.hop}"][data-way="${had.way}"]`, el)?.focus();
};
