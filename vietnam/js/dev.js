import { $, html } from './dom.js';
import { IS_DEV } from './config.js';
import { STRATEGIES } from './strategies.js';
import { computeBudget } from './budget.js';
import { CHECKLIST } from './data/checklist.js';
import { ACTIVITIES, DEFAULT_PICKS } from './data/activities.js';

// Developer bar (Command pattern: each button is a named action on the store).
// Opens with ?dev=1, localStorage.IS_DEV='true', or the D key.

const PRESETS = {
  'Solo shoestring': { travellers: 1, strategy: 'bus', bed: 500, food: 600, local: 150, buffer: 5, berth: '6' },
  'Couple, comfy': { travellers: 2, strategy: 'train', bed: 1400, food: 1200, local: 400, buffer: 10, berth: '4' },
  'Four, fast': { travellers: 4, strategy: 'fly', bed: 1000, food: 1000, local: 300, buffer: 10 },
};

export function mountDev(store) {
  const bar = $('#devbar');
  let open = IS_DEV;
  const allChecks = (on) => Object.fromEntries(CHECKLIST.map((c) => [c.id, on]));

  const ACTIONS = {
    'Cycle route': () => store.set((s) => ({ strategy: STRATEGIES[(STRATEGIES.findIndex((x) => x.id === s.strategy) + 1) % STRATEGIES.length].id })),
    'All picks': () => store.setPicks(Object.fromEntries(ACTIVITIES.map((x) => [x.id, true]))),
    'No picks': () => store.setPicks({}),
    'Default picks': () => store.setPicks({ ...DEFAULT_PICKS }),
    'Parks + cruise': () => store.setPicks(Object.fromEntries(ACTIVITIES.filter((x) => x.tag === 'park' || x.id === 'halongOvernight').map((x) => [x.id, true]))),
    'Tick all': () => store.set({ checklist: allChecks(true) }),
    'Untick all': () => store.set({ checklist: {} }),
    'Dump budget': () => { $('pre', bar).hidden = !$('pre', bar).hidden; },
    Reset: () => store.reset(),
    ...Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, () => store.set(v)])),
  };

  bar.innerHTML = html`
    <span class="eyebrow">dev</span>
    ${Object.keys(ACTIONS).map((k) => html`<button type="button" data-act="${k}">${k}</button>`)}
    <pre hidden></pre>`;
  bar.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) ACTIONS[b.dataset.act](); });

  const paint = () => { bar.dataset.open = String(open); localStorage.setItem('IS_DEV', String(open)); };
  store.subscribe((s) => {
    const b = computeBudget(s);
    const placed = Object.fromEntries(b.plan.placed);
    $('pre', bar).textContent = JSON.stringify({ state: s, total: b.total, group: b.group, lines: Object.fromEntries(b.lines.map((l) => [l.id, l.amount])), placed, noRoom: b.plan.noRoom }, null, 1);
  });
  paint();
  return () => { open = !open; paint(); };
}
