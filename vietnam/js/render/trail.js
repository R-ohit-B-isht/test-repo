import { $$, html } from '../dom.js';
import { locate, pinFrom, whereIs } from '../trail.js';
import { stopName } from '../today.js';
import { trailCard } from './trl/view.js';

// Trail controller: the "I'm here" button, pin removal with Undo, and the
// small bit of UI state (busy / last error) the card needs. Mounted once per
// page; the Today page asks for `trailUi()` when it paints its card, and this
// file repaints the card in place when only the UI state changed.

let store;
let ui = { busy: false, error: '' };

export const trailUi = () => ui;

const toast = (text, undo) => document.dispatchEvent(new CustomEvent('toast', { detail: { text, undo, icon: 'pin' } }));

const repaint = () => {
  const s = store.get();
  $$('[data-trail-card]').forEach((el) => {
    el.outerHTML = trailCard(s, Number(el.dataset.trailCard), ui);
  });
};

async function dropPin() {
  if (ui.busy) return;
  ui = { busy: true, error: '' };
  repaint();
  try {
    const fix = await locate();
    const p = pinFrom(fix);
    ui = { busy: false, error: '' };
    store.addPin(p);
    const w = whereIs(p);
    toast(`Pinned · ${stopName(w.stop.id)}${w.place ? ` · near ${w.place.name}` : ''}`, () => store.setPin(p.id, { deleted: true }));
  } catch (e) {
    ui = { busy: false, error: e.message || 'Could not get a location' };
    repaint();
  }
}

const removePin = (id) => {
  store.setPin(id, { deleted: true });
  toast('Pin removed', () => store.setPin(id, { deleted: false }));
};

export function mountTrail(s) {
  store = s;
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-trail-pin]')) return dropPin();
    const del = e.target.closest('[data-trail-del]');
    if (del) return removePin(del.dataset.trailDel);
    return undefined;
  });
}

export const trailSection = (state, n) => html`${trailCard(state, n, ui)}`;
