import { DEFAULT_STATE, STORAGE_KEY } from './config.js';

// Observer pattern: one state object, subscribers re-render on every change.
// Persists to localStorage so a refresh keeps your route and sliders, and every
// page (or tab) of the site reads the same plan — a change in one tab repaints
// the others through the `storage` event.

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return structuredClone(DEFAULT_STATE);
    return { ...structuredClone(DEFAULT_STATE), ...saved, picks: { ...DEFAULT_STATE.picks, ...(saved.picks || {}) } };
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
  addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || e.newValue === JSON.stringify(state)) return;
    state = load();
    subs.forEach((fn) => fn(state));
  });

  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
      emit();
    },
    togglePick(id) {
      this.set((s) => ({ picks: { ...s.picks, [id]: !s.picks[id] } }));
    },
    setPicks(picks) {
      this.set({ picks });
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
