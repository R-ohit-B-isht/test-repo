import { $, $$, html } from '../dom.js';
import { icon } from '../icons.js';
import { REELS } from '../data/reels.js';
import { lookup } from '../data/activities.js';

// Reels: short real-world clips of a place, one tap from its tile. The clip
// list lives in data/reels.js (YouTube ids picked by hand); this file is the
// play chip, the lightbox and its keyboard/focus plumbing. Nothing loads until
// a chip is tapped, so tiles stay light.

// A pick saved from a YouTube link brings its own clip (`yt`).
export const reelsOf = (x) => (x?.yt ? [{ v: x.yt, t: x.clip || x.name, by: x.by || 'YouTube', len: '', short: true }] : REELS[x?.id] || []);

const poster = (r) => `https://i.ytimg.com/vi/${r.v}/hqdefault.jpg`;
const embed = (r) => `https://www.youtube-nocookie.com/embed/${r.v}?autoplay=1&rel=0&playsinline=1`;
const watch = (r) => `https://www.youtube.com/watch?v=${r.v}`;

export const reelChip = (x) => {
  const n = reelsOf(x).length;
  return n ? html`<button class="reel" type="button" data-reel="${x.id}" aria-label="Play ${n} clip${n > 1 ? 's' : ''} of ${x.name}">${icon('play')}<span>${n > 1 ? `${n} reels` : 'reel'}</span></button>` : '';
};

let ui = { id: null, i: 0, lastFocus: null };

const clipRow = (cur) => (r, i) => html`
  <button class="rclip ${i === cur ? 'is-cur' : ''}" type="button" data-clip="${i}" aria-pressed="${String(i === cur)}">
    <img src="${poster(r)}" alt="" width="120" height="90" loading="lazy" decoding="async" />
    <span class="txt"><b>${r.t}</b><span class="sub">${r.by} · ${r.len}</span></span>
  </button>`;

const view = (state) => {
  const x = lookup(state, ui.id);
  const list = reelsOf(x);
  const r = list[ui.i];
  if (!x || !r) return '';
  return html`
    <div class="card">
      <div class="card-head">
        <h3 class="h3" id="reel-title">${x.name}</h3>
        <button class="btn-icon" type="button" data-close aria-label="Close">×</button>
      </div>
      <div class="rframe ${r.short ? 'is-short' : ''}">
        <iframe src="${embed(r)}" title="${r.t}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" loading="eager"></iframe>
      </div>
      <p class="sub rmeta"><b>${r.t}</b>${r.by ? ` · ${r.by}` : ''} · <a href="${watch(r)}" target="_blank" rel="noopener">YouTube ↗</a></p>
      ${list.length > 1 ? html`<div class="rclips" role="group" aria-label="More clips">${list.map(clipRow(ui.i))}</div>` : ''}
    </div>`;
};

let root;
let store;

const lockedByBoard = () => $('#board')?.dataset.open === 'true';

const paint = () => {
  root.innerHTML = view(store.get());
};

const open = (id, i = 0) => {
  if (!reelsOf(lookup(store.get(), id)).length) return;
  if (ui.id == null) ui.lastFocus = document.activeElement;
  ui = { ...ui, id, i };
  root.dataset.open = 'true';
  root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  paint();
  $('[data-close]', root).focus();
};

const close = () => {
  if (ui.id == null) return;
  ui.id = null;
  root.dataset.open = 'false';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '';
  if (!lockedByBoard()) document.body.classList.remove('is-locked');
  ui.lastFocus?.focus();
  ui.lastFocus = null;
};

// Returns true when the click was a reel chip, so tile handlers skip the toggle.
export const reelClick = (e) => !!e.target.closest('[data-reel]');

export function mountReel(s) {
  store = s;
  root = $('#reel');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-reel]');
    if (b) open(b.dataset.reel);
  });
  root.addEventListener('click', (e) => {
    if (e.target === root || e.target.closest('[data-close]')) return close();
    const c = e.target.closest('[data-clip]');
    if (c) { ui.i = Number(c.dataset.clip); paint(); $$('[data-clip]', root)[ui.i]?.focus(); }
    return undefined;
  });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } });
  return { open, close, isOpen: () => ui.id != null };
}
