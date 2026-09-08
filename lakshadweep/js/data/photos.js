// Photo registry: trip/route shots + exact catalogue-item shots, one flat id → record map.
// Credit + licence for every record are rendered in Sources.
import { TRIP_PHOTOS } from './photos/trip.js';
import { ITEM_PHOTO_RECORDS } from './photos/items.js';
import { WEB_PHOTO_RECORDS, WEB_ITEM_PHOTOS } from './photos/web.js';
import { KOCHI_PHOTO_RECORDS, KOCHI_ITEM_PHOTOS } from './photos/kochi.js';

// Web records last so a same-id trip shot (kochi, ship) is replaced by the stronger one.
export const PHOTOS = { ...TRIP_PHOTOS, ...ITEM_PHOTO_RECORDS, ...KOCHI_PHOTO_RECORDS, ...WEB_PHOTO_RECORDS };

// Catalogue item id → photo ids. Only photos whose source names the exact island /
// landmark / activity are listed; items with no such photo are absent.
const COMMONS_ITEM_PHOTOS = {
  agatti: ['agatti', 'agatti_1', 'agatti_2', 'boat'],
  kavaratti: ['kavaratti', 'kavaratti_1', 'kavaratti_2', 'kavaratti_3'],
  minicoy: ['minicoy_1', 'minicoy_2', 'minicoy_3'],
  kalpeni: ['kalpeni_1', 'kalpeni_2', 'kalpeni_3'],
  kadmat: ['kadmat_1', 'kadmat_2', 'kadmat_3'],
  kiltan: ['kiltan_1', 'kiltan_2'],
  chetlat: ['chetlat_1', 'chetlat_2', 'chetlat_3'],
  bangaram: ['bangaram', 'bangaram_1', 'bangaram_2'],
  cheriyam: ['cheriyam_1', 'cheriyam_2'],
  agattiBeach: ['lagoon', 'agattiBeach_1', 'agattiBeach_2'],
  aquarium: ['aquarium_1', 'aquarium_2', 'aquarium_3'],
  minicoyLight: ['minicoyLight_1'],
  kayak: ['lagoon'],
  scuba: ['scuba_1', 'scuba_2', 'scuba_3'],
  snorkel: ['snorkel_1', 'snorkel_2', 'snorkel_3'],
  fishing: ['fishing_1', 'fishing_2'],
  glassBottom: ['glassBottom_1'],
  jetSki: ['bangaram_w1'],
  ...KOCHI_ITEM_PHOTOS,
};

// Web shots lead (they're the exciting ones), Commons set follows.
export const ITEM_PHOTOS = Object.fromEntries(
  [...new Set([...Object.keys(WEB_ITEM_PHOTOS), ...Object.keys(COMMONS_ITEM_PHOTOS)])]
    .map((id) => [id, [...(WEB_ITEM_PHOTOS[id] || []), ...(COMMONS_ITEM_PHOTOS[id] || [])]])
);

export const itemPhotos = (id) => (ITEM_PHOTOS[id] || []).map((k) => ({ id: k, ...PHOTOS[k] }));
export const photoSize = (p) => ({ w: p.w || 960, h: p.h || 640 });
// Catalogue item a photo id belongs to, if any (trip shots of Agatti/Kavaratti double as item shots).
export const photoOwner = (photoId) => Object.keys(ITEM_PHOTOS).find((k) => ITEM_PHOTOS[k].includes(photoId));
