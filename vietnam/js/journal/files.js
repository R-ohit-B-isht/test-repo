import { JOURNAL_MAX_PX, JOURNAL_THUMB_PX } from '../config.js';
import { putFile, getFile, canStore } from '../vault/db.js';
import { takenAt } from './exif.js';
import { newPhotoId, dayForTime, MAX_PHOTOS } from '../journal.js';

// Service layer between the Journal UI and the two stores (same shape as
// vault/files.js for documents): the photo is decoded once, re-encoded at a
// sane size for a phone album (JOURNAL_MAX_PX on the long edge) plus a small
// thumb for the grid, and both blobs go to IndexedDB under the photo id
// (`<id>` and `<id>-t`). Only the description goes to planner state.

const OK = /^image\/(jpeg|png|webp|gif|avif|heic|heif)$/;

export const checkPhoto = (file, count) => {
  if (!canStore()) return 'This browser cannot keep photos offline.';
  if (!OK.test(file.type) && !/\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.name)) return `${file.name}: not a photo we can read.`;
  if (count >= MAX_PHOTOS) return `That's ${MAX_PHOTOS} photos — the journal is full.`;
  return null;
};

const decode = async (file) => {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    if (e?.name === 'TypeError' || e?.name === 'InvalidStateError') {
      // HEIC/HEIF from an iPhone: Chrome and Firefox cannot decode it.
      if (/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name)) throw new Error(`${file.name}: this browser can't read HEIC · export it as JPG first.`);
    }
    throw new Error(`${file.name}: could not be read as a photo.`);
  }
};

const shrink = (bmp, max, quality) => {
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  const ctx = c.getContext('2d');
  ctx.drawImage(bmp, 0, 0, w, h);
  const blob = c.convertToBlob ? c.convertToBlob({ type: 'image/jpeg', quality }) : new Promise((ok) => c.toBlob(ok, 'image/jpeg', quality));
  return blob.then((b) => ({ blob: b, w, h }));
};

// → metadata record for state.photos, or throws with a readable message.
export async function importPhoto(file, count, dayHint = null) {
  const bad = checkPhoto(file, count);
  if (bad) throw new Error(bad);
  const [taken, bmp] = await Promise.all([takenAt(file), decode(file)]);
  const [full, thumb] = await Promise.all([shrink(bmp, JOURNAL_MAX_PX, 0.86), shrink(bmp, JOURNAL_THUMB_PX, 0.8)]);
  bmp.close?.();
  const id = newPhotoId();
  await putFile(id, full.blob);
  await putFile(`${id}-t`, thumb.blob);
  const t = taken || file.lastModified || null;
  return {
    id, day: dayHint ?? dayForTime(t), name: file.name, type: 'image/jpeg', size: full.blob.size,
    w: full.w, h: full.h, taken: t, exif: !!taken, added: Date.now(), caption: '', deleted: false,
  };
}

// Object URLs for the grid and lightbox, released when the page repaints.
const urls = new Map();
export async function photoUrl(id, thumb = false) {
  const key = thumb ? `${id}-t` : id;
  if (urls.has(key)) return urls.get(key);
  const blob = await getFile(key);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urls.set(key, url);
  return url;
}
export const releasePhotoUrls = () => { urls.forEach((u) => URL.revokeObjectURL(u)); urls.clear(); };
export const photoBlob = (id) => getFile(id);
