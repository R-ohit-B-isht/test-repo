// Builds what the model sees: the planner's own vocabulary (ids it may use,
// priced from the same data the ledger uses) and the traveller's current plan.
// Nothing here is a fare source: prices are quoted so the model can reason,
// and the ledger recomputes everything after an edit.
import { CATALOGUE, REACH, WHEN, isExtra } from '../data/catalogue.js';
import { PRICES } from '../data/prices.js';
import { STRATEGIES, SHIP_CLASSES, TRAIN_CLASSES } from '../strategies.js';
import { BLOCKS } from '../data/days.js';
import { compareStrategies } from '../budget.js';
import { SKIP_REASON } from '../grouping.js';
import { TRAVELLERS, HOMESTAY } from './schema.js';

const priceOf = (item) => {
  if (!item.key) return 'free';
  const p = PRICES[item.key];
  return p.status === 'unavailable' ? 'price unknown' : `₹${p.amount}`;
};

const BASE_NAME = { sea: 'aboard ship', rail: 'on the train' };
const basesOf = (s) => [...new Set(s.days.map((d) => BASE_NAME[BLOCKS[d].base] || BLOCKS[d].base))];

function catalogueLines() {
  return CATALOGUE.map((c) =>
    `${c.id} | ${c.name} | ${c.group} | ${isExtra(c) ? 'extra (walk/look-in, not counted)' : `major (${c.slots}/4 of a day)`} | ${REACH[c.reach].label}${c.bases.length ? ` · base ${c.bases.join('/')}` : ''}${c.when ? ` · ${WHEN[c.when].label.toLowerCase()} only` : ''} | ${priceOf(c)}`,
  ).join('\n');
}

function strategyLines(rows) {
  return rows.map((r) => `${r.strategy.id} | ${r.strategy.name} | ${r.plan.length} days | sleeps at ${basesOf(r.strategy).join(', ')} | ₹${Math.round(r.perPerson)}/person now`).join('\n');
}

export function systemPrompt(state) {
  return [
    'You edit a Lakshadweep trip plan (Delhi ⇄ islands, October 2026) for a fun-oriented traveller on a budget.',
    'Reply ONLY with JSON per the schema: a one-line summary and a list of changes. Each change is one op with one value.',
    'Ops: pick / unpick take a catalogue id. strategy, shipClass, trainClass take an id. travellers and homestayRate take a number as text.',
    `travellers ${TRAVELLERS.min}-${TRAVELLERS.max}. homestayRate ${HOMESTAY.min}-${HOMESTAY.max} per room per night (2 share), step ${HOMESTAY.step}.`,
    'Rules: use only ids listed below. Propose the fewest changes that satisfy the request (usually 1-4, max 8). Never restate the current state as a change.',
    'Only pick items reachable from an island the chosen route sleeps at; "off route" islands need a route that sleeps there (none do) so do not pick them unless asked.',
    'Walks, beaches and monuments are extras: they ride along with a day and never count as activities. Fun = boats, diving, snorkelling, kayaking, fishing, glass-bottom, dance.',
    'Cheaper: prefer sail-both or train-sail, bunk/sleeper class, lower homestayRate, drop paid extras. Prices are planning estimates; do not invent numbers.',
    '',
    'CATALOGUE (id | name | group | weight | how reached · base island(s) | price per person):',
    catalogueLines(),
    '',
    'ROUTES (id | name | length | bases | total with current picks):',
    strategyLines(compareStrategies(state)),
    '',
    `SHIP CLASSES: ${SHIP_CLASSES.map((c) => `${c.id} (${c.name}: ${c.hint})`).join('; ')}`,
    `TRAIN CLASSES: ${TRAIN_CLASSES.map((c) => `${c.id} (${c.name}: ${c.hint})`).join('; ')}`,
  ].join('\n');
}

export function userPrompt(state, budget, prompt) {
  const { plan } = budget;
  const on = Object.keys(state.picks).filter((k) => state.picks[k]);
  const days = plan.days.map((d) => `D${d.n} ${d.base}: ${d.picks.map((p) => p.id + (isExtra(p) ? '*' : '')).join(', ') || '—'}`).join('\n');
  const skipped = plan.skipped.map((s) => `${s.item.id} (${SKIP_REASON[s.why] || s.why})`).join(', ');
  return [
    `CURRENT: strategy=${state.strategy} shipClass=${state.shipClass} trainClass=${state.trainClass} travellers=${state.travellers} homestayRate=${state.homestayRate}`,
    `Picked on: ${on.join(', ') || 'none'}`,
    `Total now: ₹${Math.round(budget.perPerson)}/person, transport ₹${Math.round(budget.transport)}, ${plan.activityCount} major activities over ${plan.length} days.`,
    `Days (* = extra):\n${days}`,
    skipped ? `Picked but unplaced: ${skipped}` : '',
    '',
    `REQUEST: ${prompt}`,
  ].filter(Boolean).join('\n');
}
