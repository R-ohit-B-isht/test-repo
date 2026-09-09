import { $ } from '../dom.js';
import { findStrategy } from '../strategies.js';
import { recapSlides, journalStats, canRecap, RECAP_STEP_MS } from '../journal.js';
import { photoUrl } from '../journal/files.js';
import { recapView } from './jn/view.js';

// Photo recap (Polarsteps' trip reel, Google Photos' Memories): a story
// player over the journal — one beat per photo, a segmented bar on top with a
// break per day, tap the edges to move, ends on a "that was Vietnam" slide.
// Autoplays unless the user prefers reduced motion. Same overlay plumbing as
// the trail replay (focus return, Escape, body lock). Opens from `[data-recap]`.

let root;
let store;
let ui = { open: false, i: 0, end: false, playing: false, timer: 0, lastFocus: null };

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const lockedElsewhere = () => ['#board', '#reel', '#replay', '#jn-view'].some((id) => $(id)?.dataset.open === 'true');
const slides = () => recapSlides(store.get());

const focusKey = () => {
  const a = document.activeElement;
  if (!root.contains(a)) return null;
  return a.dataset.close !== undefined ? '[data-close]' : a.dataset.rc ? `[data-rc="${a.dataset.rc}"]` : null;
};

// Fill the current (and preload the next) photo from IndexedDB after paint.
const hydrate = async () => {
  const img = $('img[data-ph]', root);
  if (img && !img.src) { const u = await photoUrl(img.dataset.ph, false); if (u && root.contains(img)) img.src = u; }
  const nxt = slides()[ui.i + 1];
  if (nxt) photoUrl(nxt.p.id, false);
};

const paint = () => {
  const s = store.get();
  const list = slides();
  if (!list.length) return close();
  ui.i = Math.min(ui.i, list.length - 1);
  const key = focusKey();
  root.innerHTML = recapView(list, ui.i, journalStats(s), ui.playing, reduce(), ui.end, findStrategy(s.strategy).transit);
  if (key) $(key, root)?.focus();
  hydrate();
};

const stop = () => { clearTimeout(ui.timer); ui.timer = 0; ui.playing = false; };

const tick = () => {
  if (ui.i >= slides().length - 1) { ui.end = true; stop(); paint(); return; }
  ui.i += 1;
  paint();
  ui.timer = setTimeout(tick, RECAP_STEP_MS);
};

const play = () => {
  if (reduce()) return;
  ui.playing = true;
  ui.timer = setTimeout(tick, RECAP_STEP_MS);
};

const go = (i) => {
  const n = slides().length;
  if (ui.end && i < n) ui.end = false;
  if (i >= n) { ui.end = true; ui.i = n - 1; stop(); return paint(); }
  ui.i = Math.max(0, i);
  return paint();
};

const open = () => {
  if (ui.open || !canRecap(store.get())) return;
  ui = { ...ui, open: true, i: 0, end: false, lastFocus: document.activeElement };
  root.dataset.open = 'true';
  root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  play();
  paint();
  ($('[data-rc="toggle"]', root) || $('[data-close]', root))?.focus();
};

const close = () => {
  if (!ui.open) return;
  stop();
  ui.open = false;
  root.dataset.open = 'false';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '';
  if (!lockedElsewhere()) document.body.classList.remove('is-locked');
  ui.lastFocus?.focus();
  ui.lastFocus = null;
};

const share = async () => {
  const s = journalStats(store.get());
  const text = `Vietnam, 24–31 Oct · ${s.photos} photos over ${s.days} days`;
  try {
    if (navigator.share) await navigator.share({ title: 'Our Vietnam recap', text });
    else { await navigator.clipboard.writeText(text); document.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Recap copied', icon: 'share' } })); }
  } catch (e) {
    if (e?.name !== 'AbortError') document.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Could not share', icon: 'info' } }));
  }
};

export function mountRecap(s) {
  store = s;
  root = $('#recap');
  if (!root) return null;
  document.addEventListener('click', (e) => { if (e.target.closest('[data-recap]')) open(); });
  root.addEventListener('click', (e) => {
    if (e.target === root || e.target.closest('[data-close]')) return close();
    const b = e.target.closest('[data-rc]');
    if (b?.dataset.rc === 'prev') { stop(); return go(ui.end ? ui.i : ui.i - 1); }
    if (b?.dataset.rc === 'next') { stop(); return go(ui.i + 1); }
    if (b?.dataset.rc === 'replay') { ui.i = 0; ui.end = false; play(); return paint(); }
    if (b?.dataset.rc === 'toggle') { if (ui.playing) stop(); else play(); paint(); $('[data-rc="toggle"]', root)?.focus(); }
    if (e.target.closest('[data-rc-share]')) share();
    return undefined;
  });
  document.addEventListener('keydown', (e) => {
    if (!ui.open || e.target.closest('input, textarea, select')) return;
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); stop(); go(ui.end && e.key === 'ArrowLeft' ? ui.i : ui.i + (e.key === 'ArrowRight' ? 1 : -1)); }
    if (e.key === ' ' && !ui.end && !reduce() && !e.target.closest('button, a')) { e.preventDefault(); if (ui.playing) stop(); else play(); paint(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && ui.playing) { stop(); paint(); } });
  store.subscribe(() => { if (ui.open) paint(); });
  return { open, close, isOpen: () => ui.open };
}
