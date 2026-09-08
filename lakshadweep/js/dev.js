// Developer mode panel: presets, one-click state shortcuts, data dumps.
import { html, raw, $ } from './dom.js';
import { CHECKLIST } from './data/trip.js';
import { STRATEGIES } from './strategies.js';
import { computeBudget, compareStrategies } from './budget.js';
import { CATALOGUE, DEFAULT_PICKS } from './data/catalogue.js';
import { systemPrompt, userPrompt } from './ai/context.js';

const pickSet = (on) => Object.fromEntries(CATALOGUE.map((c) => [c.id, on]));
const ALL_ON = pickSet(true);
const ALL_OFF = pickSet(false);

const PRESETS = {
  broke: { travellers: 2, homestayRate: 2500, strategy: 'train-sail', shipClass: 'bunk', trainClass: 'sleeper', picks: ALL_OFF },
  cheap: { travellers: 2, homestayRate: 3000, strategy: 'sail-both', shipClass: 'bunk', trainClass: 'sleeper', picks: DEFAULT_PICKS },
  couple: { travellers: 2, homestayRate: 3000, strategy: 'fly-sail', shipClass: 'second', trainClass: 'sleeper', picks: { ...DEFAULT_PICKS, snorkel: true, bangaram: true, glass: true } },
  family: { travellers: 4, homestayRate: 4000, strategy: 'fly-both', shipClass: 'first', trainClass: '3a', picks: ALL_ON },
  cruise: { travellers: 2, homestayRate: 3000, strategy: 'samudram', shipClass: 'first', trainClass: '3a', picks: ALL_ON },
};

const ACTIONS = [
  { id: 'broke', label: 'Preset · train + ship, nothing picked' },
  { id: 'cheap', label: 'Preset · default (sail both)' },
  { id: 'couple', label: 'Preset · couple, fly out + boats' },
  { id: 'family', label: 'Preset · family of 4, everything picked' },
  { id: 'cruise', label: 'Preset · Samudram, everything picked' },
  { id: 'allOn', label: 'Pick everything (grouping stress test)' },
  { id: 'allOff', label: 'Pick nothing' },
  { id: 'cycle', label: 'Cycle strategy (R)' },
  { id: 'checkAll', label: 'Tick all bookings' },
  { id: 'uncheckAll', label: 'Clear bookings' },
  { id: 'dump', label: 'Dump budget JSON' },
  { id: 'plan', label: 'Dump day grouping' },
  { id: 'compare', label: 'Dump all strategies' },
  { id: 'askFill', label: 'Planner · fill a sample ask' },
  { id: 'askDump', label: 'Planner · dump prompt sent to Gemini' },
  { id: 'reset', label: 'Reset saved state' },
];

function run(id, store, out, planner) {
  if (PRESETS[id]) return store.set({ ...PRESETS[id], picks: { ...PRESETS[id].picks } });
  if (id === 'allOn') return store.set({ picks: { ...ALL_ON } });
  if (id === 'allOff') return store.set({ picks: { ...ALL_OFF } });
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
  if (id === 'plan') {
    const { plan } = computeBudget(store.get());
    const days = plan.days.map((d) => ({ n: d.n, date: d.date, base: d.base, fixed: d.fixed.length, picks: d.picks.map((p) => p.id) }));
    const skipped = plan.skipped.map((s) => `${s.item.id}: ${s.why}`);
    out.textContent = JSON.stringify({ placed: plan.placedCount, days, skipped }, null, 1);
  }
  if (id === 'askFill') return planner.fill('Three of us, more diving, cheaper stay');
  if (id === 'askDump') {
    const s = store.get();
    out.textContent = `${systemPrompt(s)}\n\n---\n\n${userPrompt(s, computeBudget(s), '<your ask>')}`;
  }
  if (id === 'compare') {
    const rows = compareStrategies(store.get()).map((r) => ({ id: r.strategy.id, days: r.plan.length, transport: r.transport, essentials: r.essentials, perPerson: r.perPerson }));
    out.textContent = JSON.stringify(rows, null, 1);
  }
}

export function mountDev(store, planner) {
  const panel = $('#dev');
  panel.innerHTML = html`
    <div class="dev__head"><span>Developer mode</span><button type="button" class="chip" data-dev-close aria-label="Close developer mode">Esc</button></div>
    <div class="dev__grid">${raw(ACTIONS.map((a) => html`<button type="button" data-dev="${a.id}">${a.label}</button>`).join(''))}</div>
    <pre class="dev__out" id="dev-out" aria-live="polite"></pre>`;
  const out = $('#dev-out');
  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-dev]');
    if (btn) run(btn.dataset.dev, store, out, planner);
    if (e.target.closest('[data-dev-close]')) panel.hidden = true;
  });
  store.subscribe((s) => {
    if (!panel.hidden) {
      const b = computeBudget(s);
      const picked = Object.values(s.picks).filter(Boolean).length;
      out.textContent = `strategy=${s.strategy} ship=${s.shipClass} train=${s.trainClass} n=${s.travellers} rate=${s.homestayRate} picked=${picked} placed=${b.plan.placedCount} skipped=${b.plan.skipped.length}\ntransport=${b.transport} essentials=${b.essentials} extras=${b.extras} perPerson=${b.perPerson} group=${b.group} unpriced=${b.unpriced.length}`;
    }
  });
  return { toggle: () => { panel.hidden = !panel.hidden; } };
}
