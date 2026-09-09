import { $, html } from '../dom.js';
import { magSource, magModel, magUrl } from '../mag.js';
import { spread } from './mg/spread.js';
import { cover, contents, numbers, back, badLink } from './mg/pages.js';

// The magazine page. One issue of one plan: cover → contents → a spread per
// day → the numbers → back cover. Read-only by design: nothing here writes to
// the store, so a friend opening your link sees your plan, not theirs.

let src = null;

const flash = (msg) => {
  const out = $('#mg-out');
  if (!out) return;
  out.textContent = msg;
  clearTimeout(out._t);
  out._t = setTimeout(() => { out.textContent = ''; }, 2400);
};

const draw = (state) => {
  const host = $('#mag');
  const from = src.from;
  if (from === 'bad') {
    host.innerHTML = badLink();
    document.title = 'Shared link · Vietnam planner';
  } else {
    const m = magModel(state);
    host.innerHTML = html`${cover(m, from)}${contents(m)}<div class="mg-spreads">${m.days.map(spread)}</div>${numbers(m)}${back(m, from, src.p)}`;
    document.title = `${m.title} · ${m.dates} · magazine`;
  }
  host.removeAttribute('aria-busy');
};

export function mountMag(store) {
  src = magSource(location.search, store.get());
  $('#mag').addEventListener('click', async (e) => {
    const b = e.target.closest('[data-mg]');
    if (!b) return;
    const url = src.from === 'link' ? location.href : magUrl(store.get());
    if (b.dataset.mg === 'print') window.print();
    if (b.dataset.mg === 'copy') {
      try { await navigator.clipboard.writeText(url); flash('Copied'); } catch { flash('Copy the address bar'); }
    }
    if (b.dataset.mg === 'share') {
      try { await navigator.share({ title: document.title, url }); } catch { /* cancelled */ }
    }
  });
}

// A shared issue is frozen: your own edits elsewhere must not redraw it.
export function renderMag(state) {
  if (!src) return;
  if (src.from === 'mine') { draw(state); return; }
  if (!$('#mag').children.length) draw(src.state);
}
