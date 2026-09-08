// Photo-first media for a day: the day's picks that have exact photos lead
// (tap → lightbox); transit-only days fall back to the strategy's route photo.
import { PHOTOS, itemPhotos, photoSize, photoOwner } from '../data/photos.js';
import { CATALOGUE } from '../data/catalogue.js';
import { html, raw } from '../dom.js';
import { icon } from '../icons.js';

export const img = (p, cls = '') => html`<img class="${cls}" src="${p.src}" alt="${p.alt}" width="${photoSize(p).w}" height="${photoSize(p).h}" loading="lazy" decoding="async">`;

// First photo of an item not already shown on an earlier card, so consecutive
// days on the same island don't repeat one shot. Falls back to the first.
export function fresh(photos, used) {
  const i = Math.max(0, photos.findIndex((p) => !used.has(p.id)));
  used.add(photos[i].id);
  return i;
}

const lead = (s, i) => html`
    <button type="button" class="day__lead" data-gallery="${s.item.id}" data-gallery-i="${i}" aria-label="${s.photos.length} photos of ${s.item.name}">
      ${raw(img(s.photos[i], 'day__photo'))}
      <span class="day__lead-tag">${raw(icon('camera'))}${s.photos.length}</span>
    </button>`;

// A day's fallback photo that belongs to a catalogue item (e.g. the Kavaratti
// palm) opens that item's gallery; pure transit shots stay plain.
function fallback(day, used) {
  if (!day.photo) return '';
  const id = photoOwner(day.photo);
  const item = id && CATALOGUE.find((c) => c.id === id);
  if (!item) { used.add(day.photo); return img(PHOTOS[day.photo], 'day__photo'); }
  const s = { item, photos: itemPhotos(id) };
  return lead(s, fresh(s.photos, used));
}

export const shots = (day) => day.picks.map((p) => ({ item: p, photos: itemPhotos(p.id) })).filter((s) => s.photos.length);

export function dayMedia(day, used) {
  const shot = shots(day);
  if (!shot.length) return fallback(day, used);
  const [first, ...rest] = shot;
  const li = fresh(first.photos, used);
  const strip = rest.slice(0, 3).map((s) => {
    const i = fresh(s.photos, used);
    return html`
    <button type="button" class="day__thumb" data-gallery="${s.item.id}" data-gallery-i="${i}" aria-label="${s.photos.length} photos of ${s.item.name}">${raw(img(s.photos[i]))}</button>`;
  });
  return lead(first, li) + (strip.length ? html`<span class="day__strip">${raw(strip.join(''))}</span>` : '');
}
