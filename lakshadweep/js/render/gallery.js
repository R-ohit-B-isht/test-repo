// Photo lightbox: one native <dialog> shared by every catalogue item and day
// card. Opened by click/tap/Enter (never hover-only); ←/→ step, Esc closes.
import { CATALOGUE } from '../data/catalogue.js';
import { itemPhotos, photoSize } from '../data/photos.js';
import { html, raw, $ } from '../dom.js';
import { icon } from '../icons.js';

let photos = [];
let at = 0;
let opener = null;

function show() {
  const p = photos[at];
  const { w, h } = photoSize(p);
  const dlg = $('#gallery');
  $('[data-gal-img]', dlg).innerHTML = html`<img src="${p.src}" alt="${p.alt}" width="${w}" height="${h}" decoding="async">`;
  $('[data-gal-cap]', dlg).textContent = p.alt;
  $('[data-gal-credit]', dlg).innerHTML = html`<a href="${p.page}" target="_blank" rel="noopener">${p.artist}</a> · <a href="${p.licenseUrl}" target="_blank" rel="noopener">${p.license}</a>`;
  $('[data-gal-n]', dlg).textContent = photos.length > 1 ? `${at + 1} / ${photos.length}` : '';
  $('[data-gal-prev]', dlg).disabled = photos.length < 2;
  $('[data-gal-next]', dlg).disabled = photos.length < 2;
}

const step = (d) => { at = (at + d + photos.length) % photos.length; show(); };

export function openGallery(itemId, index = 0, from = null) {
  photos = itemPhotos(itemId);
  if (!photos.length) return;
  at = Math.min(index, photos.length - 1);
  opener = from;
  const item = CATALOGUE.find((c) => c.id === itemId);
  $('#gallery [data-gal-title]').textContent = item ? item.name : '';
  show();
  $('#gallery').showModal();
}

export function mountGallery() {
  const dlg = $('#gallery');
  dlg.innerHTML = html`
    <div class="gal__head">
      <span class="label" data-gal-title></span>
      <span class="label gal__n" data-gal-n></span>
      <button class="chip gal__close" type="button" data-gal-close aria-label="Close">${raw(icon('close'))}</button>
    </div>
    <figure class="gal__fig">
      <div class="gal__img" data-gal-img></div>
      <figcaption class="gal__cap"><span data-gal-cap></span><small class="label" data-gal-credit></small></figcaption>
    </figure>
    <button class="gal__arrow gal__arrow--prev" type="button" data-gal-prev aria-label="Previous photo">${raw(icon('left'))}</button>
    <button class="gal__arrow gal__arrow--next" type="button" data-gal-next aria-label="Next photo">${raw(icon('right'))}</button>`;
  $('[data-gal-close]', dlg).addEventListener('click', () => dlg.close());
  $('[data-gal-prev]', dlg).addEventListener('click', () => step(-1));
  $('[data-gal-next]', dlg).addEventListener('click', () => step(1));
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });
  dlg.addEventListener('close', () => { if (opener?.isConnected) opener.focus(); });

  // Any element with data-gallery="<itemId>" (optionally data-gallery-i) opens it.
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-gallery]');
    if (!el) return;
    e.preventDefault();
    openGallery(el.dataset.gallery, Number(el.dataset.galleryI || 0), el);
  });
}
