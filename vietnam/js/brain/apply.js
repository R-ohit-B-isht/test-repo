import { STOPS } from '../data/trip.js';
import { EXTRA_STOPS, catalogOf, lookup, isFun } from '../data/activities.js';
import { STRATEGIES } from '../strategies.js';

// Turns a Gemini reply into a list of small, tickable commands (Command
// pattern). Each carries a label for the review list and a `patch(state)`.
// Anything that fails validation is dropped into `ignored` and shown as such.

const STOP_IDS = new Set([...STOPS, ...EXTRA_STOPS].map((s) => s.id));
const STOP_NAME = Object.fromEntries([...STOPS, ...EXTRA_STOPS].map((s) => [s.id, s.name]));
const SLOTS = new Set(['am', 'pm', 'night', 'any', 'day']);

const DIALS = {
  travellers: { min: 1, max: 6, label: (v) => `${v} traveller${v > 1 ? 's' : ''}` },
  bed: { min: 200, max: 6000, label: (v) => `bed ₹${v}/night` },
  food: { min: 200, max: 4000, label: (v) => `food ₹${v}/day` },
  local: { min: 50, max: 2500, label: (v) => `getting around ₹${v}/day` },
  buffer: { min: 0, max: 40, label: (v) => `${v}% buffer` },
};

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 32);

const change = (kind, key, label, sub, patch) => ({ kind, key, label, sub, patch, checked: true });

const pickChanges = (ids, want, state, out, ignored) => {
  (Array.isArray(ids) ? ids : []).forEach((id) => {
    const x = lookup(state, id);
    if (!x) return ignored.push(`unknown id "${id}"`);
    if (x.closed) return ignored.push(`${x.name} · ${x.closed}`);
    if (!!state.picks[id] === want) return;
    out.push(change(want ? 'on' : 'off', `${want ? 'on' : 'off'}:${id}`, x.name, `${STOP_NAME[x.stop] || x.stop} · ${isFun(x) ? 'fun' : 'see'}`, (s) => ({ picks: { ...s.picks, [id]: want } })));
  });
};

const dialChanges = (set, state, out, ignored) => {
  if (!set || typeof set !== 'object') return;
  Object.entries(DIALS).forEach(([k, d]) => {
    const v = set[k];
    if (v == null) return;
    const n = Math.round(Number(v));
    if (!Number.isFinite(n) || n < d.min || n > d.max) return ignored.push(`${k}=${v} out of range`);
    if (n === state[k]) return;
    out.push(change('set', `set:${k}`, d.label(n), `was ${d.label(state[k])}`, () => ({ [k]: n })));
  });
  if (set.strategy != null && set.strategy !== state.strategy) {
    const st = STRATEGIES.find((s) => s.id === set.strategy);
    if (!st) ignored.push(`unknown route "${set.strategy}"`);
    else out.push(change('set', 'set:strategy', st.name, `route · was ${STRATEGIES.find((s) => s.id === state.strategy)?.name}`, () => ({ strategy: st.id })));
  }
  if (set.berth != null && String(set.berth) !== state.berth && ['4', '6'].includes(String(set.berth))) {
    out.push(change('set', 'set:berth', `${set.berth}-berth sleeper`, 'night train cabin', () => ({ berth: String(set.berth) })));
  }
};

const toActivity = (a) => ({
  id: `ai-${slug(a.name)}`,
  stop: a.stop,
  slot: a.slot,
  h: Math.min(12, Math.max(0.5, Number(a.hours) || 2)),
  name: a.name.trim(),
  icon: 'sparkle',
  kind: a.kind === 'see' ? 'see' : 'fun',
  inr: a.inr == null ? 0 : Math.max(0, Math.round(Number(a.inr))),
  free: a.inr == null || Number(a.inr) <= 0,
  est: true,
  note: (a.note || 'added by Gemini · estimate').trim(),
});

const addChanges = (adds, state, out, ignored) => {
  const names = new Set(catalogOf(state).map((x) => x.name.toLowerCase()));
  (Array.isArray(adds) ? adds : []).forEach((a) => {
    if (!a || typeof a.name !== 'string' || !a.name.trim()) return ignored.push('add without a name');
    if (!STOP_IDS.has(a.stop)) return ignored.push(`${a.name}: unknown stop "${a.stop}"`);
    if (!SLOTS.has(a.slot)) return ignored.push(`${a.name}: unknown slot "${a.slot}"`);
    if (names.has(a.name.trim().toLowerCase())) return ignored.push(`${a.name} is already in the catalog`);
    const x = toActivity(a);
    if (lookup(state, x.id)) return ignored.push(`${a.name} already added`);
    out.push(change('add', `add:${x.id}`, x.name, `new · ${STOP_NAME[x.stop]} · ${x.free ? 'free' : `≈₹${x.inr} estimate`}`, (s) => ({ custom: [...(s.custom || []), x], picks: { ...s.picks, [x.id]: true } })));
  });
};

const removeChanges = (ids, state, out, ignored) => {
  (Array.isArray(ids) ? ids : []).forEach((id) => {
    const x = (state.custom || []).find((c) => c.id === id);
    if (!x) return ignored.push(`cannot remove "${id}" — not a Gemini-added spot`);
    out.push(change('remove', `remove:${id}`, x.name, 'remove added spot', (s) => {
      const picks = { ...s.picks };
      delete picks[id];
      return { custom: (s.custom || []).filter((c) => c.id !== id), picks };
    }));
  });
};

export function toChanges(reply, state) {
  const out = [];
  const ignored = [];
  pickChanges(reply.on, true, state, out, ignored);
  pickChanges(reply.off, false, state, out, ignored);
  dialChanges(reply.set, state, out, ignored);
  addChanges(reply.add, state, out, ignored);
  removeChanges(reply.remove, state, out, ignored);
  return { say: String(reply.say || '').trim(), why: Array.isArray(reply.why) ? reply.why.map(String) : [], changes: out, ignored };
}

// Folds the ticked commands over a state — used for the preview and the apply.
export const applyChanges = (state, changes) => changes.filter((c) => c.checked).reduce((s, c) => ({ ...s, ...c.patch(s) }), state);
