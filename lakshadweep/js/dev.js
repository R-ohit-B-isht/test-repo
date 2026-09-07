// Developer mode panel: presets, one-click state shortcuts, data dumps.
import { html, raw, $ } from './dom.js';
import { CHECKLIST } from './data/trip.js';
import { STRATEGIES } from './strategies.js';
import { computeBudget, compareStrategies } from './budget.js';

const ALL_ON = { scuba: true, bangaram: true, snorkel: true, kayak: true, glassBottom: true };
const ALL_OFF = { scuba: false, bangaram: false, snorkel: false, kayak: false, glassBottom: false };

const PRESETS = {
  broke: { travellers: 2, homestayRate: 2500, strategy: 'train-sail', shipClass: 'second', trainClass: 'sleeper', activities: ALL_OFF },
  cheap: { travellers: 2, homestayRate: 3000, strategy: 'sail-both', shipClass: 'second', trainClass: 'sleeper', activities: ALL_OFF },
  couple: { travellers: 2, homestayRate: 3000, strategy: 'fly-sail', shipClass: 'second', trainClass: 'sleeper', activities: { ...ALL_OFF, snorkel: true, bangaram: true } },
  family: { travellers: 4, homestayRate: 4000, strategy: 'fly-both', shipClass: 'first', trainClass: '3a', activities: ALL_ON },
  cruise: { travellers: 2, homestayRate: 3000, strategy: 'samudram', shipClass: 'first', trainClass: '3a', activities: ALL_OFF },
};

const ACTIONS = [
  { id: 'broke', label: 'Preset · train + ship, no extras' },
  { id: 'cheap', label: 'Preset · default (sail both)' },
  { id: 'couple', label: 'Preset · couple, fly out + 2 boats' },
  { id: 'family', label: 'Preset · family of 4, all on' },
  { id: 'cruise', label: 'Preset · Samudram cruise' },
  { id: 'cycle', label: 'Cycle strategy (R)' },
  { id: 'checkAll', label: 'Tick all bookings' },
  { id: 'uncheckAll', label: 'Clear bookings' },
  { id: 'dump', label: 'Dump budget JSON' },
  { id: 'compare', label: 'Dump all strategies' },
  { id: 'reset', label: 'Reset saved state' },
];

function run(id, store, out) {
  if (PRESETS[id]) return store.set({ ...PRESETS[id], activities: { ...PRESETS[id].activities } });
  if (id === 'cycle') {
    const i = STRATEGIES.findIndex((s) => s.id === store.get().strategy);
    return store.set({ strategy: STRATEGIES[(i + 1) % STRATEGIES.length].id });
  }
  if (id === 'checkAll') return store.set({ checked: Object.fromEntries(CHECKLIST.map((c) => [c.id, true])) });
  if (id === 'uncheckAll') return store.set({ checked: {} });
  if (id === 'reset') return store.reset();
  if (id === 'dump') {
    const b = computeBudget(store.get());
    const { plan, strategy, legs, ...rest } = b;
    out.textContent = JSON.stringify({ state: store.get(), strategy: strategy.id, days: plan.length, ...rest }, null, 1);
  }
  if (id === 'compare') {
    const rows = compareStrategies(store.get()).map((r) => ({ id: r.strategy.id, days: r.plan.length, transport: r.transport, essentials: r.essentials, perPerson: r.perPerson }));
    out.textContent = JSON.stringify(rows, null, 1);
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
      out.textContent = `strategy=${s.strategy} ship=${s.shipClass} train=${s.trainClass} n=${s.travellers} rate=${s.homestayRate}\ntransport=${b.transport} essentials=${b.essentials} extras=${b.extras} perPerson=${b.perPerson} group=${b.group}`;
    }
  });
  return { toggle: () => { panel.hidden = !panel.hidden; } };
}
