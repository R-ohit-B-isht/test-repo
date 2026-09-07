import { SOURCES } from '../data/sources.js';
import { DESIGN_CREDITS } from '../data/trip.js';
import { PHOTOS, ITEM_PHOTOS } from '../data/photos.js';
import { CATALOGUE } from '../data/catalogue.js';
import { html, raw, $ } from '../dom.js';

const host = (url) => url.replace(/^https?:\/\//, '').split('/')[0];

export function mountSources() {
  $('#source-count').textContent = `· ${Object.keys(SOURCES).length}`;
  $('#source-list').innerHTML = Object.values(SOURCES).map((s, i) => html`
    <li class="source">
      <span class="source__n">${String(i + 1).padStart(2, '0')}</span>
      <span class="source__body">
        <a href="${s.url}" target="_blank" rel="noopener">${s.name}</a>
        <span class="label">${host(s.url)}</span>
      </span>
      <span class="source__note">${s.note}</span>
    </li>`).join('');

  $('#credit-list').innerHTML = DESIGN_CREDITS.map((c, i) => html`
    <li class="source">
      <span class="source__n">${String(i + 1).padStart(2, '0')}</span>
      <span class="source__body">
        <a href="${c.url}" target="_blank" rel="noopener">${c.name}</a>
        <span class="label">${host(c.url)}</span>
      </span>
      <span class="source__note">${c.taken}</span>
    </li>`).join('');

  // photo key → first catalogue item using it, so each credit names its subject
  // and its thumbnail opens that item's gallery at the right frame.
  const usedBy = {};
  for (const [id, keys] of Object.entries(ITEM_PHOTOS)) keys.forEach((k, i) => { usedBy[k] ??= { id, i }; });
  const name = (id) => CATALOGUE.find((c) => c.id === id)?.name || id;
  const photos = Object.entries(PHOTOS);
  $('#photo-count').textContent = `· ${photos.length}`;
  $('#photo-list').innerHTML = photos.map(([k, p]) => {
    const u = usedBy[k];
    const thumb = html`<img src="${p.src}" alt="" width="96" height="64" loading="lazy" decoding="async">`;
    return html`
    <li class="source source--photo">
      ${u ? raw(html`<button type="button" class="source__thumb" data-gallery="${u.id}" data-gallery-i="${u.i}" aria-label="Open photo of ${name(u.id)}">${raw(thumb)}</button>`) : raw(thumb)}
      <span class="source__body">
        <a href="${p.page}" target="_blank" rel="noopener">${p.alt}</a>
        <span class="label">${u ? `${name(u.id)} · ` : ''}${p.artist} · <a href="${p.licenseUrl}" target="_blank" rel="noopener">${p.license}</a> · ${host(p.page)}</span>
      </span>
    </li>`;
  }).join('');
}
