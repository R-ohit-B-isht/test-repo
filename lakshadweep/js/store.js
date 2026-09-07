// Tiny observable store with localStorage persistence.

const STORAGE_KEY = 'lakshadweep-ledger:v1';

export const DEFAULT_STATE = {
  strategy: 'fly-sail',
  shipClass: 'second',
  travellers: 2,
  homestayRate: 3000,
  activities: { scuba: true, bangaram: true, snorkel: true, kayak: true, glassBottom: true },
  checked: {},
  theme: 'auto',
};

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const saved = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...saved,
      activities: { ...DEFAULT_STATE.activities, ...(saved.activities || {}) },
      checked: { ...(saved.checked || {}) },
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function createStore() {
  let state = load();
  const listeners = new Set();

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable (private mode) — state still lives in memory */
    }
  }

  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
      persist();
      listeners.forEach((fn) => fn(state));
    },
    reset() {
      state = { ...DEFAULT_STATE, activities: { ...DEFAULT_STATE.activities }, checked: {} };
      persist();
      listeners.forEach((fn) => fn(state));
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
  };
}
