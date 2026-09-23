/** Where My routine was last left open — the view (Today / Full week / …) and the part tab (Face / Hair / …) — so the page
 * reopens there. Display-side only, kept apart from the routine record (`ledger.routine.v1`); a URL `?area=` still wins. */
import { isArea, type Area } from './model';

const KEY = 'ledger.routine.view.v1';

export const PREF_VIEWS = ['today', 'week', 'shelf', 'notes', 'remind'] as const;
export type PrefView = (typeof PREF_VIEWS)[number];
const isPrefView = (v: unknown): v is PrefView => typeof v === 'string' && (PREF_VIEWS as readonly string[]).includes(v);

export interface ViewPrefs { view: PrefView | null; area: Area | null }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function loadViewPrefs(): ViewPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!isRecord(parsed)) return { view: null, area: null };
    return { view: isPrefView(parsed.view) ? parsed.view : null, area: isArea(parsed.area) ? parsed.area : null };
  } catch {
    return { view: null, area: null };
  }
}

export function saveViewPrefs(prefs: ViewPrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); }
  catch { /* private mode / quota: the preference lives until the tab closes */ }
}
