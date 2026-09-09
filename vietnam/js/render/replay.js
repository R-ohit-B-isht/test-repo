import { $, $$ } from '../dom.js';
import { STRATEGIES } from '../strategies.js';
import { replayFrames } from '../trail/replay.js';
import { mapSvg } from './map.js';
import { trailLayer } from './trl/layer.js';
import { replayView } from './trl/view.js';

// End-of-trip replay (Polarsteps' "trip reel", Peak-End rule): the map grows
// day by day, one frame per trip day, autoplaying unless the user prefers
// reduced motion. Opens from any `[data-replay]` button; same overlay plumbing
// as the reel lightbox (focus return, Escape, body lock).

const STEP_MS = 1800;
let root;
let store;
let ui = { open: false, i: 0, playing: false, timer: 0, lastFocus: null };

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const lockedElsewhere = () => ['#board', '#reel'].some((id) => $(id)?.dataset.open === 'true');

// Repainting replaces the markup, so remember which control had focus and
// put it back (keyboard users step with the arrows while frames change).
const focusKey = () => {
  const a = document.activeElement;
  if (!root.contains(a)) return null;
  return a.dataset.close !== undefined ? '[data-close]' : a.dataset.rp ? `[data-rp="${a.dataset.rp}"]` : a.dataset.rpGo ? `[data-rp-go="${a.dataset.rpGo}"]` : null;
};

const paint = () => {
  const s = store.get();
  const frames = replayFrames(s);
  const f = frames[ui.i];
  const strat = STRATEGIES.find((x) => x.id === s.strategy) || STRATEGIES[0];
  const svg = mapSvg(strat, trailLayer(f.cum), `, replaying day ${f.n}`, f.n);
  const key = focusKey();
  root.innerHTML = replayView(frames, ui.i, svg, s.strategy, ui.playing, reduce());
  if (key) $(key, root)?.focus();
};

const stop = () => { clearInterval(ui.timer); ui.timer = 0; ui.playing = false; };

const tick = () => {
  if (ui.i >= replayFrames(store.get()).length - 1) { stop(); paint(); return; }
  ui.i += 1;
  paint();
};

const play = () => {
  if (reduce()) return;
  ui.playing = true;
  ui.timer = setInterval(tick, STEP_MS);
};

const go = (i) => {
  const n = replayFrames(store.get()).length;
  ui.i = Math.max(0, Math.min(n - 1, i));
  if (ui.i === n - 1) stop();
  paint();
};

const open = () => {
  if (ui.open) return;
  ui = { ...ui, open: true, i: 0, lastFocus: document.activeElement };
  root.dataset.open = 'true';
  root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('is-locked');
  play();
  paint();
  $('[data-close]', root)?.focus();
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
  const frames = replayFrames(store.get());
  const last = frames.at(-1);
  const km = Math.round(frames.reduce((s, f) => s + f.km, 0));
  const text = `Vietnam, 24–31 Oct · ${last.cum.length} pins · ${km} km on the ground · ${new Set(frames.flatMap((f) => f.stops)).size} stops`;
  try {
    if (navigator.share) await navigator.share({ title: 'Our Vietnam trail', text });
    else { await navigator.clipboard.writeText(text); document.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Recap copied', icon: 'share' } })); }
  } catch (e) {
    if (e?.name !== 'AbortError') document.dispatchEvent(new CustomEvent('toast', { detail: { text: 'Could not share', icon: 'info' } }));
  }
};

export function mountReplay(s) {
  store = s;
  root = $('#replay');
  if (!root) return null;
  document.addEventListener('click', (e) => { if (e.target.closest('[data-replay]')) open(); });
  root.addEventListener('click', (e) => {
    if (e.target === root || e.target.closest('[data-close]')) return close();
    const g = e.target.closest('[data-rp-go]');
    if (g) { stop(); return go(Number(g.dataset.rpGo)); }
    const b = e.target.closest('[data-rp]');
    if (b?.dataset.rp === 'prev') { stop(); return go(ui.i - 1); }
    if (b?.dataset.rp === 'next') { stop(); return go(ui.i + 1); }
    if (b?.dataset.rp === 'toggle') { if (ui.playing) stop(); else { if (ui.i >= replayFrames(store.get()).length - 1) ui.i = 0; play(); } paint(); $('[data-rp="toggle"]', root)?.focus(); }
    if (e.target.closest('[data-rp-share]')) share();
    return undefined;
  });
  document.addEventListener('keydown', (e) => {
    if (!ui.open || e.target.closest('input, textarea, select')) return;
    if (e.key === 'Escape') { e.stopPropagation(); close(); }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      stop();
      go(ui.i + (e.key === 'ArrowRight' ? 1 : -1));
      $$('[data-rp-go]', root)[ui.i]?.focus();
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && ui.playing) { stop(); paint(); } });
  store.subscribe(() => { if (ui.open) paint(); });
  return { open, close, isOpen: () => ui.open };
}
