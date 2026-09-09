import { $, $$ } from '../dom.js';
import { DAYS } from '../data/days.js';
import { findStrategy } from '../strategies.js';
import { byDay, photoOf, neighbours } from '../journal.js';
import { photoUrl, photoBlob } from '../journal/files.js';
import { hero, dayBlock, looseBlock, viewer } from './jn/view.js';

// Journal page controller: one block per trip day, a lightbox for a single
// photo (caption, move to another day, save, remove with Undo). Photo bytes
// come from IndexedDB after each paint; the store only ever sees metadata.
// Intake (file inputs, drag & drop) is render/ingest.js; recap is render/recap.js.

let store;
let root;
let box;
let ui = { busy: '', error: '', view: null, lastFocus: null };

const transitOf = (s) => findStrategy(s.strategy).transit;

// Fill every `<img data-ph>` that has no src yet from IndexedDB.
export async function hydrate(scope) {
  const imgs = $$('img[data-ph]:not([src])', scope);
  await Promise.all(imgs.map(async (img) => {
    const url = await photoUrl(img.dataset.ph, img.dataset.size !== 'full');
    if (!url) { img.closest('li, figure')?.classList.add('is-gone'); return; }
    if (scope.contains(img)) img.src = url;
  }));
}

// Repaints replace the markup; keep focus on the same control (arrows,
// caption, day select) so keyboard users don't lose their place.
const focusKey = () => {
  const a = document.activeElement;
  if (!box.contains(a)) return null;
  if (a.classList.contains('is-prev')) return '.jn-nav.is-prev';
  if (a.classList.contains('is-next')) return '.jn-nav.is-next';
  if (a.dataset.caption !== undefined) return '[data-caption]';
  if (a.dataset.move !== undefined) return '[data-move]';
  if (a.dataset.remove !== undefined) return '[data-remove]';
  return '[data-close]';
};

const paintBox = () => {
  if (!ui.view) return;
  const s = store.get();
  const p = photoOf(s, ui.view);
  if (!p || p.deleted) { const nb = neighbours(s, ui.view); return nb.next || nb.prev ? show((nb.next || nb.prev).id) : closeBox(); }
  const key = focusKey() || '[data-close]';
  box.innerHTML = viewer(s, p, DAYS);
  const el = $(key, box);
  (el && !el.disabled ? el : $('[data-close]', box)).focus();
  hydrate(box);
  return undefined;
};

function show(id) {
  if (!ui.view) { ui.lastFocus = document.activeElement; document.body.classList.add('is-locked'); }
  ui.view = id;
  box.dataset.open = 'true';
  box.setAttribute('aria-hidden', 'false');
  paintBox();
}

function closeBox() {
  if (!ui.view) return;
  ui.view = null;
  box.dataset.open = 'false';
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = '';
  if (!['#board', '#reel', '#recap'].some((s) => $(s)?.dataset.open === 'true')) document.body.classList.remove('is-locked');
  ui.lastFocus?.focus();
  ui.lastFocus = null;
}

const remove = (id) => {
  const s = store.get();
  const nb = neighbours(s, id);
  store.setPhoto(id, { deleted: true });
  document.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Photo removed', icon: 'trash', undo: () => store.setPhoto(id, { deleted: false }) } }));
  if (ui.view === id) { const to = nb.next || nb.prev; if (to) show(to.id); else closeBox(); }
};

const save = async (id, a) => {
  const blob = await photoBlob(id);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const tmp = Object.assign(document.createElement('a'), { href: url, download: a.getAttribute('download') });
  tmp.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export function mountJournal(s) {
  store = s;
  root = $('#journal');
  box = $('#jn-view');
  if (!root || !box) return;
  document.addEventListener('journal:status', (e) => { ui = { ...ui, ...e.detail }; renderJournal(store.get()); });
  root.addEventListener('click', (e) => {
    const v = e.target.closest('[data-view]');
    if (v) show(v.dataset.view);
  });
  box.addEventListener('click', (e) => {
    if (e.target === box || e.target.closest('[data-close]')) return closeBox();
    const nav = e.target.closest('[data-nav]');
    if (nav?.dataset.nav) return show(nav.dataset.nav);
    const rm = e.target.closest('[data-remove]');
    if (rm) return remove(rm.dataset.remove);
    const dl = e.target.closest('[data-dl]');
    if (dl) { e.preventDefault(); return save(dl.dataset.dl, dl); }
    return undefined;
  });
  box.addEventListener('change', (e) => {
    const mv = e.target.closest('[data-move]');
    if (mv) return store.setPhoto(mv.dataset.move, { day: mv.value ? Number(mv.value) : null });
    const cap = e.target.closest('[data-caption]');
    if (cap) return store.setPhoto(cap.dataset.caption, { caption: cap.value.trim() });
    return undefined;
  });
  document.addEventListener('keydown', (e) => {
    if (!ui.view || e.target.closest('input, select, textarea')) return;
    if (e.key === 'Escape') { e.stopPropagation(); closeBox(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const nb = neighbours(store.get(), ui.view);
      const to = e.key === 'ArrowRight' ? nb.next : nb.prev;
      if (to) { e.preventDefault(); show(to.id); }
    }
  });
  // Deep links from Today: journal.html#day-3 scrolls to that block after paint.
  if (location.hash.startsWith('#day-')) requestAnimationFrame(() => $(location.hash)?.scrollIntoView({ block: 'start' }));
}

export function renderJournal(state) {
  if (!root) return;
  const { days, loose } = byDay(state);
  const transit = transitOf(state);
  $('#jn-hero').innerHTML = hero(state, ui);
  $('#jn-days').innerHTML = days.map((g) => dayBlock(g, transit)).join('') + looseBlock(loose);
  hydrate(root);
  if (ui.view) paintBox();
}
