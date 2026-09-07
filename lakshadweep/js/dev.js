// Developer mode panel: presets, one-click state shortcuts, data dumps.
import { html, raw, $ } from './dom.js';
import { CHECKLIST } from './data/trip.js';
import { STRATEGIES } from './strategies.js';
import { computeBudget } from './budget.js';

const PRESETS = {
  solo: { travellers: 1, homestayRate: 2500, strategy: 'sail-both', shipClass: 'second', activities: { scuba: true, bangaram: false, snorkel: true, kayak: false, glassBottom: false } },
  couple: { travellers: 2, homestayRate: 3000, strategy: 'fly-sail', shipClass: 'second', activities: { scuba: true, bangaram: true, snorkel: true, kayak: true, glassBottom: true } },
  family: { travellers: 4, homestayRate: 4000, strategy: 'fly-both', shipClass: 'first', activities: { scuba: false, bangaram: true, snorkel: true, kayak: true, glassBottom: true } },
};

const ACTIONS = [
  { id: 'solo', label: 'Preset · solo, cheapest' },
  { id: 'couple', label: 'Preset · couple (default)' },
  { id: 'family', label: 'Preset · family of 4' },
  { id: 'cycle', label: 'Cycle strategy' },
  { id: 'checkAll', label: 'Tick all bookings' },
  { id: 'uncheckAll', label: 'Clear bookings' },
  { id: 'dump', label: 'Dump budget JSON' },
  { id: 'reset', label: 'Reset saved state' },
];

function run(id, store, out) {
  if (PRESETS[id]) return store.set({ ...PRESETS[id] });
  if (id === 'cycle') {
    const i = STRATEGIES.findIndex((s) => s.id === store.get().strategy);
    return store.set({ strategy: STRATEGIES[(i + 1) % STRATEGIES.length].id });
  }
  if (id === 'checkAll') return store.set({ checked: Object.fromEntries(CHECKLIST.map((c) => [c.id, true])) });
  if (id === 'uncheckAll') return store.set({ checked: {} });
  if (id === 'reset') return store.reset();
  if (id === 'dump') {
    const b = computeBudget(store.get());
    out.textContent = JSON.stringify({ state: store.get(), lines: b.lines, perPerson: b.perPerson, group: b.group }, null, 1);
  }
}

export function mountDev(store) {
  const panel = $('#dev');
  panel.innerHTML = html`
    <div class="dev__head"><span>Developer mode</span><button type="button" class="chip" data-dev-close aria-label="Close developer mode">Esc</button></div>
    <div class="dev__grid">${raw(ACTIONS.map((a) => html`<button type="button" data-dev="${a.id}">${a.label}</button>`).join(''))}</div>
    <pre class="dev__out" id="dev-out" aria-live="polite"></pre>`;
  const out = $('#dev-out');
  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dev]');
    if (btn) run(btn.dataset.dev, store, out);
    if (e.target.closest('[data-dev-close]')) panel.hidden = true;
  });
  store.subscribe((s) => {
    if (!panel.hidden) {
      const b = computeBudget(s);
      out.textContent = `strategy=${s.strategy} class=${s.shipClass} n=${s.travellers} rate=${s.homestayRate}\nperPerson=${b.perPerson} group=${b.group}`;
    }
  });
  return { toggle: () => { panel.hidden = !panel.hidden; } };
}
