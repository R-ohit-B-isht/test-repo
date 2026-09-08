// Validation of model output against the app's own data. Every proposed change
// comes back tagged ok/rejected with a human reason; only ok ones can be applied.
import { OPS, MAX_CHANGES, HOMESTAY } from './schema.js';
import { CATALOGUE_BY_ID } from '../data/catalogue.js';
import { STRATEGIES, SHIP_CLASSES, TRAIN_CLASSES } from '../strategies.js';

const NUMERIC = new Set(['travellers', 'homestayRate']);

function coerce(op, raw) {
  const s = String(raw ?? '').trim();
  if (!NUMERIC.has(op)) return s;
  const n = Number(s.replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(n)) return NaN;
  return op === 'homestayRate' ? Math.round(n / HOMESTAY.step) * HOMESTAY.step : Math.round(n);
}

function nameOf(op, value) {
  if (op === 'pick' || op === 'unpick') return CATALOGUE_BY_ID[value]?.name || value;
  if (op === 'strategy') return STRATEGIES.find((s) => s.id === value)?.name || value;
  if (op === 'shipClass') return SHIP_CLASSES.find((c) => c.id === value)?.name || value;
  if (op === 'trainClass') return TRAIN_CLASSES.find((c) => c.id === value)?.name || value;
  if (op === 'homestayRate') return `₹${value} / room`;
  return String(value);
}

// A change that leaves the state as it is has nothing to apply.
function isNoop(op, value, state) {
  if (op === 'pick') return state.picks[value] === true;
  if (op === 'unpick') return !state.picks[value];
  return state[OPS[op].field] === value;
}

function check(change, state, seen) {
  const op = String(change?.op || '');
  const spec = OPS[op];
  if (!spec) return { op, value: change?.value, ok: false, reason: 'unknown edit' };
  const value = coerce(op, change.value);
  const why = String(change.why || '').slice(0, 80);
  const base = { op, value, why, label: spec.label, name: nameOf(op, value) };
  if (!spec.valid(value)) return { ...base, ok: false, reason: 'not in this planner' };
  const dupKey = op === 'pick' || op === 'unpick' ? `picks:${value}` : spec.field;
  if (seen.has(dupKey)) return { ...base, ok: false, reason: 'duplicate' };
  seen.add(dupKey);
  if (isNoop(op, value, state)) return { ...base, ok: false, reason: 'already so' };
  return { ...base, ok: true };
}

export function validateChanges(changes, state) {
  const seen = new Set();
  const list = Array.isArray(changes) ? changes.slice(0, MAX_CHANGES) : [];
  return list.map((c) => check(c, state, seen));
}
