// Day sheet: tap a day (card head or map pill) → <dialog> with the day's
// tiles grouped Travel · See & do · Eat · Stay. Photo tiles open the lightbox;
// ← / → step days. Rebuilt from the live plan on every open.
import { buildPlan } from '../plan.js';
import { dayTotal, fmt } from '../budget.js';
import { html, raw, $, fmtDateLong } from '../dom.js';
import { icon } from '../icons.js';
import { img } from './dayMedia.js';
import { daySheetModel } from './daySheetModel.js';

let store = null;
let opener = null;
let current = 0;

function tile(t) {
  const photo = t.photo ? raw(img(t.photo, 'tile__photo')) : raw(html`<span class="tile__ic">${raw(icon(t.icon))}</span>`);
  const count = t.count > 1 ? html`<span class="tile__n">${raw(icon('camera'))}${t.count}</span>` : '';
  const body = html`
      ${photo}${raw(count)}
      <span class="tile__text">
        ${t.slot ? raw(html`<b class="tile__slot">${t.slot}</b>`) : ''}
        <span class="tile__name">${t.name}</span>
        ${t.sub ? raw(html`<small class="tile__sub">${t.sub}</small>`) : ''}
        ${t.tag ? raw(html`<small class="tile__tag">${t.tag}</small>`) : ''}
        ${t.note ? raw(html`<small class="tile__note">${t.note}</small>`) : ''}
      </span>`;
  return t.gallery && t.photo
    ? html`<li><button type="button" class="tile tile--photo" data-gallery="${t.gallery}" aria-label="${t.count} photos of ${t.name}">${raw(body)}</button></li>`
    : html`<li><span class="tile ${t.photo ? 'tile--photo' : ''}">${raw(body)}</span></li>`;
}

function render(m, state) {
  const { day } = m;
  const dlg = $('#daysheet');
  dlg.dataset.mode = day.icon;
  dlg.innerHTML = html`
    <header class="sheet__head">
      <span class="sheet__n">${String(day.n).padStart(2, '0')}</span>
      <span class="sheet__where"><b>${day.place}</b><time datetime="${day.date}">${fmtDateLong(day.date)}</time></span>
      <span class="sheet__mode">${raw(icon(day.icon))}</span>
      <button type="button" class="gal__close" data-sheet-close aria-label="Close">${raw(icon('close'))}</button>
    </header>
    <h3 class="sheet__title">${day.title}</h3>
    <div class="sheet__body">${raw(m.cats.map((c) => html`
      <section class="sheet__cat" data-cat="${c.id}">
        <h4 class="label">${c.label}<small>${c.tiles.length}</small></h4>
        <ul class="tiles">${raw(c.tiles.map(tile).join(''))}</ul>
      </section>`).join(''))}
    </div>
    <footer class="sheet__foot">
      <button type="button" class="sheet__step" data-sheet-step="-1" ${m.prev ? '' : 'disabled'} aria-label="Previous day">${raw(icon('left'))}<span>${m.prev ? `D${m.prev.n}` : ''}</span></button>
      <span class="sheet__spend"><small>Day spend</small><b>${fmt(dayTotal(day, state))}</b></span>
      <button type="button" class="sheet__step" data-sheet-step="1" ${m.next ? '' : 'disabled'} aria-label="Next day"><span>${m.next ? `D${m.next.n}` : ''}</span>${raw(icon('right'))}</button>
    </footer>`;
}

export function openDaySheet(n, from = null) {
  const state = store.get();
  const m = daySheetModel(buildPlan(state), Number(n));
  if (!m) return;
  current = m.day.n;
  if (from) opener = from;
  render(m, state);
  const dlg = $('#daysheet');
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}

export function mountDaySheet(s) {
  store = s;
  const dlg = $('#daysheet');
  document.addEventListener('click', (e) => {
    const el = e.target instanceof Element && e.target.closest('[data-daysheet]');
    if (!el) return;
    e.preventDefault();
    openDaySheet(el.dataset.daysheet, el);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const el = e.target instanceof Element && e.target.closest('g[data-daysheet]');
    if (!el) return;
    e.preventDefault();
    openDaySheet(el.dataset.daysheet, el);
  });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-sheet-close]')) dlg.close();
    const step = e.target.closest('[data-sheet-step]');
    if (step) openDaySheet(current + Number(step.dataset.sheetStep));
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') openDaySheet(current - 1);
    if (e.key === 'ArrowRight') openDaySheet(current + 1);
  });
  dlg.addEventListener('close', () => { if (opener?.isConnected) opener.focus(); opener = null; });
  // Re-render in place while open so pick toggles made elsewhere stay in sync.
  store.subscribe(() => { if (dlg.open) openDaySheet(current); });
}
