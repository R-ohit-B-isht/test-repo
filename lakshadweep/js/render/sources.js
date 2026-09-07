import { SOURCES } from '../data/sources.js';
import { DESIGN_CREDITS } from '../data/trip.js';
import { PHOTOS } from '../data/photos.js';
import { html, $ } from '../dom.js';

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

  const photos = Object.values(PHOTOS);
  $('#photo-count').textContent = `· ${photos.length}`;
  $('#photo-list').innerHTML = photos.map((p) => html`
    <li class="source source--photo">
      <img src="${p.src}" alt="" width="96" height="64" loading="lazy" decoding="async">
      <span class="source__body">
        <a href="${p.page}" target="_blank" rel="noopener">${p.alt}</a>
        <span class="label">${p.artist} · <a href="${p.licenseUrl}" target="_blank" rel="noopener">${p.license}</a> · Wikimedia Commons</span>
      </span>
    </li>`).join('');
}
