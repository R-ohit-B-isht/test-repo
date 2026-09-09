import { TRIP } from './data/trip.js';
import { DAYS } from './data/days.js';
import { dayOfTime } from './trail.js';

// Journal · the Polarsteps "step" idea, browser-only: photos you drop in are
// pinned to a trip day and replayed as a recap at the end. This module is the
// pure model — metadata lives in `state.photos`, the bytes in IndexedDB
// (journal/files.js). Photos are private (never in the share hash, the
// magazine, .ics or Google) and soft-deleted like everything else.
//
//   { id, day: 1..8 | null, name, type, size, w, h, taken, added, caption, deleted }

export const MAX_PHOTOS = 400;         // metadata cap; the honest limit is the browser's quota
export const RECAP_MIN = 3;            // Polarsteps needs ~10 for a reel; we ask for three
export const RECAP_STEP_MS = 2600;     // one photo per beat, a story-style progress bar on top
export const RECAP_PER_DAY = 6;        // the recap shows at most this many per day (newest kept)

export const livePhotos = (state) => (state.photos || []).filter((p) => !p.deleted).sort((a, b) => (a.taken || a.added) - (b.taken || b.added));
export const photosOn = (state, n) => livePhotos(state).filter((p) => p.day === n);
export const unsorted = (state) => livePhotos(state).filter((p) => p.day == null);
export const photoOf = (state, id) => (state.photos || []).find((p) => p.id === id) || null;

// Trip day for a photo's timestamp: EXIF "taken" first, the file's modified
// time as a fallback; anything outside 24–31 Oct lands in "Not sorted yet".
export const dayForTime = (t) => (t ? dayOfTime(t) : null);

export const newPhotoId = () => `ph-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// One group per trip day (always all eight, so empty days show a drop target)
// plus the unsorted bucket at the end when there is anything in it.
export const byDay = (state) => {
  const live = livePhotos(state);
  const days = DAYS.map((d) => ({ n: d.n, day: d, photos: live.filter((p) => p.day === d.n) }));
  const loose = live.filter((p) => p.day == null);
  return { days, loose };
};

export const journalStats = (state) => {
  const live = livePhotos(state);
  const days = new Set(live.map((p) => p.day).filter((n) => n != null));
  const bytes = live.reduce((s, p) => s + (p.size || 0), 0);
  return { photos: live.length, days: days.size, loose: live.filter((p) => p.day == null).length, bytes, of: TRIP.days };
};

// Recap frames: days that have photos, in order, each trimmed to RECAP_PER_DAY
// (the latest of the day win — the evening shots are usually the peak).
export const recapFrames = (state) => DAYS
  .map((d) => ({ n: d.n, day: d, photos: photosOn(state, d.n).slice(-RECAP_PER_DAY) }))
  .filter((f) => f.photos.length);

// Flat list of recap slides with their frame index, so the overlay can step
// photo by photo while the progress bar is segmented per day.
export const recapSlides = (state) => recapFrames(state).flatMap((f, fi) => f.photos.map((p, pi) => ({ p, f, fi, pi, first: pi === 0 })));

export const canRecap = (state) => livePhotos(state).filter((p) => p.day != null).length >= RECAP_MIN;

export const neighbours = (state, id) => {
  const live = livePhotos(state);
  const i = live.findIndex((p) => p.id === id);
  return { prev: live[i - 1] || null, next: live[i + 1] || null, i, n: live.length };
};

export const fmtBytes = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
export const hm = (t) => new Date(t).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
export const takenLabel = (p) => (p.taken ? `${new Date(p.taken).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${hm(p.taken)}` : 'No date in the file');
