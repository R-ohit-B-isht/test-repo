// Turns accepted changes into a store patch (Command) and prices it before it
// is applied, so the traveller sees the delta first. Undo keeps the previous
// state (Memento); everything still flows through store.set → buildPlan.
import { computeBudget } from '../budget.js';
import { OPS } from './schema.js';

export function patchFrom(changes, state) {
  const patch = {};
  let picks = null;
  for (const c of changes) {
    if (!c.ok) continue;
    if (c.op === 'pick' || c.op === 'unpick') {
      picks = picks || { ...state.picks };
      picks[c.value] = c.op === 'pick';
    } else {
      patch[OPS[c.op].field] = c.value;
    }
  }
  if (picks) patch.picks = picks;
  return patch;
}

export function preview(changes, state) {
  const patch = patchFrom(changes, state);
  const before = computeBudget(state);
  const after = computeBudget({ ...state, ...patch });
  return {
    patch,
    before: before.perPerson,
    after: after.perPerson,
    delta: after.perPerson - before.perPerson,
    days: after.plan.length,
    skipped: after.plan.skipped.length - before.plan.skipped.length,
    count: Object.keys(patch).length ? changes.filter((c) => c.ok).length : 0,
  };
}

export function applyChanges(store, changes) {
  const prev = store.get();
  const patch = patchFrom(changes, prev);
  if (!Object.keys(patch).length) return null;
  store.set(patch);
  return () => store.set({
    strategy: prev.strategy, shipClass: prev.shipClass, trainClass: prev.trainClass,
    travellers: prev.travellers, homestayRate: prev.homestayRate, picks: { ...prev.picks },
  });
}
