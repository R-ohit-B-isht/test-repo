import { html, inr } from '../../dom.js';
import { icon } from '../../icons.js';
import { SOURCES } from '../../data/sources.js';
import { KINDS, CITIES, byKind, mapsUrl, grabUrl } from '../../gmap.js';

// Street map · markup. City chips, kind filters, the pin list (the map's
// accessible twin — every pin is a row you can tab to) and the pin popup.

const dayChip = (p) => (p.days?.length ? html`<span class="chip chip-ink num">D${p.days.join('·')}</span>` : '');
const price = (p) => (p.inr ? html`<span class="num amt">≈${inr(p.inr)}</span>` : '');

export const cityChips = (city, counts) => html`
  <div class="gm-cities" role="tablist" aria-label="City">
    ${CITIES.map((c) => html`
      <button type="button" role="tab" data-city="${c.id}" aria-selected="${String(c.id === city.id)}" ${c.id === city.id ? 'aria-controls="gm-canvas"' : ''}>
        <b>${c.name}</b>
        <span class="num">D${c.days.join('·')} · ${counts[c.id] || 0}</span>
      </button>`)}
  </div>`;

export const kindChips = (on, counts) => html`
  <div class="gm-kinds" role="group" aria-label="Show on the map">
    ${KINDS.map((k) => html`
      <button type="button" class="chip gk-${k.id}" data-kind="${k.id}" aria-pressed="${String(on.has(k.id))}" ${counts[k.id] ? '' : 'disabled'}>
        <i></i>${k.label}<span class="num">${counts[k.id] || 0}</span>
      </button>`)}
  </div>`;

const srcLink = (p) => {
  const s = p.src && SOURCES[p.src];
  return s ? html`<a class="src" href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="Source: ${s.name}" title="${s.name}">${icon('link')}</a>` : '';
};

const pickBtn = (p, cls = 'btn btn-ghost') => (p.pick
  ? html`<button class="${cls}" type="button" data-pick="${p.pick}" aria-pressed="${String(p.kind !== 'near')}">${icon(p.kind === 'near' ? 'plus' : 'check')}${p.kind === 'near' ? 'Add to plan' : 'On the plan'}</button>`
  : '');

const row = (p, cur) => html`
  <li class="gm-row gk-${p.kind} ${p.id === cur ? 'is-cur' : ''}">
    <button class="gm-go" type="button" data-focus="${p.id}" aria-current="${String(p.id === cur)}">
      <span class="ic-wrap">${icon(p.icon || 'pin')}</span>
      <span class="txt"><b>${p.name}${p.must ? html`<span class="must" title="must-do">★</span>` : ''}</b>${p.sub ? html`<span class="sub">${p.sub}</span>` : ''}</span>
      <span class="meta">${dayChip(p)}${price(p)}</span>
    </button>
    <span class="gm-act">${pickBtn(p, 'btn btn-sm')}${srcLink(p)}</span>
  </li>`;

export const pinList = (pins, cur, unpinned) => {
  const groups = byKind(pins);
  if (!groups.length) return html`<p class="gm-empty">Nothing to pin here yet — flip a filter back on, or add picks for this city.</p>`;
  return html`
    ${groups.map((g) => html`
      <section class="gm-group" aria-labelledby="gmg-${g.id}">
        <h3 class="eyebrow" id="gmg-${g.id}"><i class="gdot gk-${g.id}"></i>${g.label} · <span class="num">${g.pins.length}</span></h3>
        <ul class="gm-rows">${g.pins.map((p) => row(p, cur))}</ul>
      </section>`)}
    ${unpinned.length ? html`<p class="gm-note">${icon('info')} No exact spot yet for ${unpinned.map((x) => x.name).join(', ')} — added from a link, so only the city is known.</p>` : ''}`;
};

export const popupHtml = (p) => html`
  <div class="gpop-in gk-${p.kind}">
    <span class="eyebrow"><i class="gdot gk-${p.kind}"></i>${KINDS.find((k) => k.id === p.kind)?.label}${p.days?.length ? html` · Day ${p.days.join(', ')}` : ''}</span>
    <b class="gpop-nm">${p.name}${p.must ? ' ★' : ''}</b>
    ${p.sub ? html`<span class="sub">${p.sub}</span>` : ''}
    <span class="gpop-row">${price(p)}${srcLink(p)}</span>
    <span class="gpop-go">
      <a class="btn btn-ghost" href="${mapsUrl(p)}" target="_blank" rel="noopener noreferrer">${icon('pin')}Google Maps</a>
      <a class="btn btn-ghost" href="${grabUrl(p)}" rel="noopener">${icon('car')}Grab</a>
      ${pickBtn(p)}
    </span>
  </div>`.s;

export const noLeaflet = () => html`
  <div class="gm-fallback">
    ${icon('offline')}
    <b>The map library didn’t load.</b>
    <span>The list below has every pin with a Google Maps link — reload once you are online.</span>
  </div>`;
