// Reel overlay: real YouTube clips of the exact place / activity. The iframe is
// injected only when the overlay opens (youtube-nocookie, no autoplay) and
// removed on close so nothing loads until asked.
import { CATALOGUE_BY_ID } from '../data/catalogue.js';
import { itemReels } from '../data/reels.js';
import { html, raw, $, $$ } from '../dom.js';
import { icon } from '../icons.js';
import { openOverlay } from '../chrome/overlay.js';

const embed = (id) => `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;

function clipRow(r, i, on) {
  return html`
    <button type="button" class="reel__clip" data-clip="${i}" aria-pressed="${on}">
      <img src="https://i.ytimg.com/vi/${r.id}/mqdefault.jpg" alt="" width="160" height="90" loading="lazy" decoding="async">
      <span class="reel__meta"><span class="reel__title">${r.title}</span><small>${r.by} · ${r.len}</small></span>
    </button>`;
}

function shell(item, reels, at) {
  const r = reels[at];
  return html`
    <div class="card reel__card">
      <div class="card-head">
        <h3 id="reel-title">${raw(icon('play'))}${item.name}</h3>
        <a class="chip" href="https://www.youtube.com/watch?v=${r.id}" target="_blank" rel="noopener">YouTube ↗</a>
        <button class="btn-icon" type="button" data-close aria-label="Close">${raw(icon('close'))}</button>
      </div>
      <div class="reel__frame"><iframe src="${embed(r.id)}" title="${r.title}" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>
      <p class="reel__credit"><a href="${r.channel}" target="_blank" rel="noopener">${r.by}</a> · ${r.len} · public YouTube clip, not ours</p>
      ${reels.length > 1 ? raw(html`<div class="reel__list" role="group" aria-label="Clips">${raw(reels.map((c, i) => clipRow(c, i, i === at)).join(''))}</div>`) : ''}
    </div>`;
}

let current = { id: null, at: 0 };

function render() {
  const item = CATALOGUE_BY_ID[current.id];
  const reels = itemReels(current.id);
  $('#reel').innerHTML = shell(item, reels, current.at);
}

export function openReel(itemId, from) {
  if (!itemReels(itemId).length) return;
  current = { id: itemId, at: 0 };
  render();
  openOverlay('#reel', from);
}

export function mountReel() {
  const box = $('#reel');
  box.addEventListener('click', (e) => {
    const clip = e.target.closest('[data-clip]');
    if (!clip) return;
    current.at = Number(clip.dataset.clip);
    render();
    $$('[data-clip]', box)[current.at].focus();
  });
  box.addEventListener('overlay:closed', () => { box.innerHTML = ''; });
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-reel]');
    if (el) openReel(el.dataset.reel, el);
  });
}
