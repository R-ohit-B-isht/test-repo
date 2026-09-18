/** Which pinned products the user has run out of (or not bought yet) — a display-side note kept apart from the routine
 * record (`ledger.routine.v1`), so marking a product never rewrites a step. Only the "not with me" ids are stored: every
 * product is taken as with you until you say otherwise, so an existing routine shows nothing greyed until you mark it. */
import { useSyncExternalStore } from 'react';

const KEY = 'ledger.routine.owned.v1';
const MAX_IDS = 300;

interface Owned { missing: ReadonlySet<string> }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function load(): Owned {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { missing: new Set() };
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.missing)) return { missing: new Set() };
    return { missing: new Set(parsed.missing.filter((id): id is string => typeof id === 'string').slice(-MAX_IDS)) };
  } catch {
    return { missing: new Set() };
  }
}

function save(owned: Owned) {
  try { localStorage.setItem(KEY, JSON.stringify({ missing: [...owned.missing].slice(-MAX_IDS) })); }
  catch { /* private mode / quota: the note lives until the tab closes */ }
}

let state: Owned = load();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const snapshot = () => state;

function set(next: Owned) {
  state = next;
  save(next);
  listeners.forEach((l) => l());
}

/** Set of product ids marked "not with me". */
export const useMissing = (): ReadonlySet<string> => useSyncExternalStore(subscribe, snapshot, snapshot).missing;

export const isMissing = (missing: ReadonlySet<string>, productId: string | null | undefined) => productId != null && missing.has(productId);

export function setHave(productId: string, have: boolean) {
  const cur = new Set(state.missing);
  if (have) cur.delete(productId); else cur.add(productId);
  set({ missing: cur });
}
