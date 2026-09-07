import { $$, html } from '../dom.js';
import { PICS } from '../data/pics.js';

// Photo strip for one activity: real Wikimedia Commons photos of that exact
// place, one frame per photo, scroll-snap to swipe, dots + hover arrows.
// The same strip is used by picker tiles and the "+days" cards; day cards
// take just the first frame as a thumbnail (thumb()).

export const picsOf = (id) => PICS[id] || [];

const small = (u) => u.replace('/500px-', '/120px-');

export const strip = (x) => {
  const p = picsOf(x.id);
  if (!p.length) return '';
  const many = p.length > 1;
  return html`
    <div class="pics" data-n="${p.length}">
      <div class="pics-track" role="group" aria-label="${p.length} photo${many ? 's' : ''} of ${x.name}" tabindex="${many ? 0 : -1}">
        ${p.map((im) => html`<img src="${im.u}" alt="${im.alt}" width="${im.w}" height="${im.h}" loading="lazy" decoding="async" title="${im.by} · ${im.lic}" />`)}
      </div>
      ${many ? html`
        <button class="pv pv-l" type="button" data-dir="-1" aria-label="Previous photo" tabindex="-1">‹</button>
        <button class="pv pv-r" type="button" data-dir="1" aria-label="Next photo" tabindex="-1">›</button>
        <span class="pics-dots" aria-hidden="true">${p.map((_, i) => html`<i class="${i === 0 ? 'is-cur' : ''}"></i>`)}</span>` : ''}
    </div>`;
};

export const thumb = (x) => {
  const im = picsOf(x.id)[0];
  return im ? html`<img class="th" src="${small(im.u)}" alt="" width="120" height="${Math.round((120 * im.h) / im.w)}" loading="lazy" decoding="async" />` : '';
};

const frameOf = (track) => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));

const goTo = (track, i) => {
  const next = Math.min(track.children.length - 1, Math.max(0, i));
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  track.scrollTo({ left: next * track.clientWidth, behavior: still ? 'auto' : 'smooth' });
};

const syncDots = (track) => {
  const i = frameOf(track);
  $$('.pics-dots i', track.parentElement).forEach((d, n) => d.classList.toggle('is-cur', n === i));
};

// Arrows nudge one frame; the track itself keeps scroll position. Returns true
// when the click was a gallery control so callers do not treat it as a toggle.
export const galleryClick = (e) => {
  const b = e.target.closest('[data-dir]');
  if (!b) return false;
  const track = b.parentElement.querySelector('.pics-track');
  goTo(track, frameOf(track) + Number(b.dataset.dir));
  return true;
};

// Off-screen frames stay lazy until the strip is hovered, touched or focused,
// so a swipe never lands on an empty frame.
const warm = (e) => {
  const pics = e.target.closest?.('.pics');
  if (!pics || pics.dataset.warm) return;
  pics.dataset.warm = '1';
  $$('img', pics).forEach((im) => { im.loading = 'eager'; });
};

export function mountGalleries(root) {
  root.addEventListener('pointerover', warm);
  root.addEventListener('touchstart', warm, { passive: true });
  root.addEventListener('focusin', warm);
  root.addEventListener('scroll', (e) => { if (e.target.classList?.contains('pics-track')) syncDots(e.target); }, true);
  root.addEventListener('keydown', (e) => {
    const track = e.target.closest?.('.pics-track');
    if (!track || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    goTo(track, frameOf(track) + (e.key === 'ArrowRight' ? 1 : -1));
  });
}
