// Tiny observable store with localStorage persistence.
// v3 key: v2's five-activity `activities` map became `picks` over the whole
// catalogue; old state is not migrated (defaults changed with the fare re-check).
import { DEFAULT_PICKS } from './data/catalogue.js';

const STORAGE_KEY = 'lakshadweep-ledger:v3';

export const DEFAULT_STATE = {
  strategy: 'sail-both',
  shipClass: 'bunk',
  trainClass: 'sleeper',
  travellers: 2,
  homestayRate: 3000,
  picks: { ...DEFAULT_PICKS },
  checked: {},
  theme: 'auto',
};

const fresh = () => ({ ...DEFAULT_STATE, picks: { ...DEFAULT_PICKS }, checked: {} });

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh();
    const saved = JSON.parse(raw);
    return {
      ...fresh(),
      ...saved,
      picks: { ...DEFAULT_PICKS, ...(saved.picks || {}) },
      checked: { ...(saved.checked || {}) },
    };
  } catch {
    return fresh();
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
      state = fresh();
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
