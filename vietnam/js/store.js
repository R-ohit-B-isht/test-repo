import { DEFAULT_STATE, STORAGE_KEY } from './config.js';

// Observer pattern: one state object, subscribers re-render on every change.
// Persists to localStorage so a refresh keeps your route and sliders.

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return structuredClone(DEFAULT_STATE);
    return { ...structuredClone(DEFAULT_STATE), ...saved, activities: { ...DEFAULT_STATE.activities, ...(saved.activities || {}) } };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
};

export function createStore() {
  let state = load();
  const subs = new Set();

  const emit = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    subs.forEach((fn) => fn(state));
  };

  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
      emit();
    },
    toggleActivity(id) {
      this.set((s) => ({ activities: { ...s.activities, [id]: !s.activities[id] } }));
    },
    toggleCheck(id) {
      this.set((s) => ({ checklist: { ...s.checklist, [id]: !s.checklist[id] } }));
    },
    reset() {
      state = structuredClone(DEFAULT_STATE);
      emit();
    },
    subscribe(fn) {
      subs.add(fn);
      fn(state);
      return () => subs.delete(fn);
    },
  };
}
