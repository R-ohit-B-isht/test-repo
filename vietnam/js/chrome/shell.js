import { $, html } from '../dom.js';
import { icon } from '../icons.js';
import { PAGES, currentPage, pageForHash, neighbours } from '../pages.js';

// Shared page chrome (Template pattern: every page has the same frame, only
// <main> differs). Fills the top bar + mobile tab bar from PAGES, injects the
// overlays every page needs (help, day board, brain, reel, dev bar), adds the
// prev / next pager, and sends old single-page anchors to their new page.

const BRAND = html`
  <a class="brand" href="index.html" aria-label="Vietnam planner, route page">
    <svg class="mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M12 3v3M8 6h8l2 4v6l-2 3H8l-2-3v-6zM12 19v2" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Vietnam
  </a>`;

const ACTIONS = html`
  <div class="topbar-actions">
    <button class="btn brain-btn" id="brain-btn" type="button" aria-label="Plan brain (Gemini)" title="Plan brain (G)">${icon('sparkle')}<span>Brain</span></button>
    <button class="btn-icon" id="theme-btn" type="button" aria-label="Theme: auto" title="Theme (T)"></button>
    <button class="btn-icon" id="help-btn" type="button" aria-label="Keyboard shortcuts" title="Shortcuts (?)">?</button>
  </div>`;

const OVERLAYS = html`
  <div class="overlay" id="help" data-open="false" role="dialog" aria-modal="true" aria-labelledby="help-title" aria-hidden="true">
    <div class="card">
      <div class="card-head">
        <h3 id="help-title">Shortcuts</h3>
        <button class="btn-icon" type="button" data-close aria-label="Close">×</button>
      </div>
      <div class="kbd-list">
        <kbd>1</kbd><span>Night train route</span>
        <kbd>2</kbd><span>Sleeper bus route</span>
        <kbd>3</kbd><span>Fly south route</span>
        <kbd>4</kbd><span>Return via Hanoi</span>
        <kbd>G</kbd><span>Plan brain (Gemini)</span>
        <kbd>T</kbd><span>Cycle theme</span>
        <kbd>D</kbd><span>Developer bar</span>
        <kbd>[ ]</kbd><span>Previous / next page</span>
        <kbd>?</kbd><span>This panel</span>
      </div>
    </div>
  </div>
  <div class="overlay board" id="board" data-open="false" role="dialog" aria-modal="true" aria-labelledby="board-title" aria-hidden="true"><div class="card"></div></div>
  <div class="overlay brain" id="brain" data-open="false" role="dialog" aria-modal="true" aria-labelledby="brain-title" aria-hidden="true"></div>
  <div class="overlay reel-box" id="reel" data-open="false" role="dialog" aria-modal="true" aria-labelledby="reel-title" aria-hidden="true"></div>
  <div class="overlay sheet" id="sheet" data-open="false" role="dialog" aria-modal="true" aria-labelledby="sheet-title" aria-hidden="true"><div class="card"></div></div>
  <div class="overlay peek" id="peek" data-open="false" role="dialog" aria-modal="true" aria-labelledby="peek-title" aria-hidden="true"></div>
  <div class="devbar" id="devbar" data-open="false" aria-label="Developer bar"></div>`;

const current = (p, here) => (p.id === here ? 'page' : 'false');
const navLink = (p, here) => html`<a href="${p.href}" aria-current="${current(p, here)}">${p.label}</a>`;
const tabLink = (p, here) => html`<a href="${p.href}" aria-current="${current(p, here)}">${icon(p.icon)}<span>${p.label}</span></a>`;

// Phone tab bar: the four `tab` pages plus a More tab. When you are on one of
// the other pages the More tab wears that page's icon and label so the bar
// still tells you where you are.
const moreTab = (rest, here) => {
  const on = rest.find((p) => p.id === here);
  return html`<button type="button" id="more-btn" aria-current="${on ? 'page' : 'false'}" aria-haspopup="dialog" aria-controls="more" aria-expanded="false">${icon(on ? on.icon : 'dots')}<span>${on ? on.label : 'More'}</span></button>`;
};

const moreSheet = (pages, here) => html`
  <div class="overlay sheet more" id="more" data-open="false" role="dialog" aria-modal="true" aria-labelledby="more-title" aria-hidden="true">
    <div class="card">
      <div class="card-head"><h3 class="h3" id="more-title">All pages</h3><button class="btn-icon" type="button" data-close aria-label="Close">×</button></div>
      <nav class="more-grid" aria-label="All pages">
        ${pages.map((p) => html`<a href="${p.href}" aria-current="${current(p, here)}">${icon(p.icon)}<b>${p.label}</b><span class="eyebrow">${p.n}</span></a>`)}
      </nav>
    </div>
  </div>`;

const mountMore = () => {
  const btn = $('#more-btn');
  const root = $('#more');
  if (!btn || !root) return;
  const set = (open) => {
    root.dataset.open = String(open);
    root.setAttribute('aria-hidden', String(!open));
    btn.setAttribute('aria-expanded', String(open));
    if (open) ($('[aria-current="page"]', root) || $('[data-close]', root)).focus();
    else btn.focus();
  };
  btn.addEventListener('click', () => set(root.dataset.open !== 'true'));
  root.addEventListener('click', (e) => { if (e.target === root || e.target.closest('[data-close]')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.dataset.open === 'true') set(false); });
};

const pagerLink = (p, dir) => (p ? html`
  <a class="pager-link is-${dir}" href="${p.href}">
    <span class="eyebrow">${dir === 'next' ? 'Next' : 'Back'} · ${p.n}</span>
    <b>${dir === 'next' ? html`${p.label} ${icon('arrow')}` : html`${icon('arrow', 'flip')} ${p.label}`}</b>
  </a>` : '<span></span>');

// Old links like /vietnam/#picker (shared before the split) still work.
const redirectLegacyHash = (here) => {
  const target = pageForHash(location.hash);
  if (target && target.id !== here) location.replace(target.href + (target.hashes[0] === location.hash.slice(1) ? '' : location.hash));
};

export function mountShell() {
  const here = currentPage();
  redirectLegacyHash(here);
  const nav = PAGES.filter((p) => !p.quiet);
  $('#topbar').innerHTML = html`${BRAND}<nav class="topnav" aria-label="Pages">${nav.map((p) => navLink(p, here))}</nav>${ACTIONS}`;
  const tabs = $('#tabbar');
  if (tabs) {
    const rest = PAGES.filter((p) => !p.tab);
    tabs.innerHTML = html`${nav.filter((p) => p.tab).map((p) => tabLink(p, here))}${moreTab(rest, here)}`;
  }
  const { prev, next } = neighbours(here);
  const pager = $('#pager');
  if (pager) pager.innerHTML = html`${pagerLink(prev, 'prev')}${pagerLink(next, 'next')}`;
  if (!$('#help')) document.body.insertAdjacentHTML('beforeend', OVERLAYS + moreSheet(PAGES, here));
  mountMore();
  return { here, prev, next };
}
