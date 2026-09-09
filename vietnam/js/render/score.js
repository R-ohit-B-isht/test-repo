import { $ } from '../dom.js';
import { computeBudget } from '../budget.js';
import { tripScore, standings, matchSheet, upgrades, toggleShowed } from '../score.js';
import { hero, daysStrip, table, sheet, rules } from './sc/view.js';
import { shareScoreCard } from '../score/card.js';

// Score page controller: derives the board from the same plan the days use,
// paints it, and turns taps into store patches. Open breakdowns stay open
// across repaints so a toggle never folds the row you were reading.

let store = null;
const toast = (text) => document.dispatchEvent(new CustomEvent('toast', { detail: { text } }));

const onClick = async (e) => {
  const t = e.target;
  const tick = t.closest('[data-showed]');
  if (tick) {
    const { showed: id, pid } = tick.dataset;
    store.set(toggleShowed(store.get(), id, pid));
    $(`[data-showed="${id}"][data-pid="${pid}"]`)?.focus({ preventScroll: true });
    return;
  }
  const day = t.closest('[data-open-day]');
  if (day) { e.preventDefault(); document.dispatchEvent(new CustomEvent('day:open', { detail: Number(day.dataset.openDay) })); return; }
  if (t.closest('[data-sc-share]')) {
    const btn = t.closest('[data-sc-share]');
    btn.disabled = true;
    try {
      const how = await shareScoreCard(store.get());
      if (how === 'saved') toast('Board saved as an image.');
    } catch { toast('Could not draw the board.'); } finally { btn.disabled = false; }
  }
};

export function mountScore(s) {
  store = s;
  const root = $('#score');
  if (!root) return;
  root.addEventListener('click', onClick);
}

const openIds = (root) => new Set([...root.querySelectorAll('details[open][data-key]')].map((d) => d.dataset.key));

export function renderScore(state) {
  const root = $('#score');
  if (!root) return;
  const plan = computeBudget(state).plan;
  const score = tripScore(state, plan);
  const st = standings(state, plan);
  const open = openIds(root);
  $('#sc-hero').innerHTML = hero(score, upgrades(state, plan));
  $('#sc-days').innerHTML = daysStrip(score);
  $('#sc-table').innerHTML = table(state, st);
  $('#sc-sheet').innerHTML = sheet(state, matchSheet(state, plan));
  $('#sc-rules').innerHTML = rules();
  open.forEach((k) => { const d = root.querySelector(`details[data-key="${k}"]`); if (d) d.open = true; });
}
