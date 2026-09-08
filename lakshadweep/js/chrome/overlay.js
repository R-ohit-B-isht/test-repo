// One controller for every `.overlay` (help, brain, reel): open/close with the
// fade transition, Escape + backdrop close, focus restore. Mediator between
// the trigger buttons and the overlay so callers never touch attributes.
import { $, $$ } from '../dom.js';

const openers = new Map();
const closing = new Map(); // id -> cancel pending hide
const FADE_MS = 260; // mirrors --t-base; fallback if transitionend never fires

export const isOpen = (id) => !$(id).hidden && !closing.has(id);

export function openOverlay(id, from = document.activeElement) {
  const el = $(id);
  const wasClosing = closing.has(id);
  closing.get(id)?.();
  if (!el.hidden && !wasClosing) return;
  openers.set(id, from);
  el.hidden = false;
  $$(`[aria-controls="${el.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'true'));
  document.body.classList.add('has-overlay');
  // Focus after the visibility flip: a `visibility: hidden` element cannot take focus.
  requestAnimationFrame(() => {
    el.dataset.open = 'true';
    $('[autofocus], [data-close]', el)?.focus();
  });
}

export function closeOverlay(id) {
  const el = $(id);
  if (el.hidden) return;
  el.dataset.open = 'false';
  let timer = 0;
  const cancel = () => { clearTimeout(timer); el.removeEventListener('transitionend', onEnd); closing.delete(id); };
  const done = () => {
    cancel();
    el.hidden = true;
    el.dispatchEvent(new CustomEvent('overlay:closed'));
  };
  const onEnd = (e) => { if (e.target === el) done(); };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) done();
  else {
    el.addEventListener('transitionend', onEnd);
    timer = setTimeout(done, FADE_MS + 60);
    closing.set(id, cancel);
  }
  $$(`[aria-controls="${el.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'false'));
  if (!$$('.overlay').some((o) => o !== el && !o.hidden)) document.body.classList.remove('has-overlay');
  const from = openers.get(id);
  if (from?.isConnected) from.focus();
}

export const toggleOverlay = (id, from) => (isOpen(id) ? closeOverlay(id) : openOverlay(id, from));

export function mountOverlays() {
  for (const el of $$('.overlay')) {
    const id = `#${el.id}`;
    el.addEventListener('click', (e) => {
      if (e.target === el || e.target.closest('[data-close]')) closeOverlay(id);
    });
  }
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-overlay]');
    if (btn) toggleOverlay(btn.dataset.overlay, btn);
  });
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = $$('.overlay').find((o) => !o.hidden);
    if (open) { e.preventDefault(); closeOverlay(`#${open.id}`); }
  });
}
