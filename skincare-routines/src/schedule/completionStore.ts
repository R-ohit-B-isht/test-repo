/** Which steps were ticked off on which calendar day — a display-side journal kept apart from the routine record
 * (`ledger.routine.v1`), so ticking never rewrites a step. Dates are local `YYYY-MM-DD`; old days are trimmed. */
import { useSyncExternalStore } from 'react';

const KEY = 'ledger.routine.done.v1';
const KEEP_DAYS = 60;

type Done = Record<string, string[]>;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function load(): Done {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};
    const out: Done = {};
    for (const [date, ids] of Object.entries(parsed)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Array.isArray(ids)) out[date] = ids.filter((id): id is string => typeof id === 'string');
    }
    return out;
  } catch {
    return {};
  }
}

function save(done: Done) {
  try {
    const dates = Object.keys(done).sort().slice(-KEEP_DAYS);
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(dates.map((d) => [d, done[d]]))));
  } catch {
    /* private mode / quota: ticks live until the tab closes */
  }
}

let state: Done = load();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const snapshot = () => state;

function set(next: Done) {
  state = next;
  save(next);
  listeners.forEach((l) => l());
}

export const useCompletion = () => useSyncExternalStore(subscribe, snapshot, snapshot);

export const doneOn = (done: Done, date: string) => new Set(done[date] ?? []);

export function toggleDone(date: string, stepId: string) {
  const cur = new Set(state[date] ?? []);
  if (cur.has(stepId)) cur.delete(stepId); else cur.add(stepId);
  set({ ...state, [date]: [...cur] });
}

export function resetDone(date: string, stepIds: string[]) {
  const drop = new Set(stepIds);
  set({ ...state, [date]: (state[date] ?? []).filter((id) => !drop.has(id)) });
}
