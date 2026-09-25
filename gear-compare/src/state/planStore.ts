import { useSyncExternalStore } from 'react';

/**
 * One organiser placed in the plan. `active` picks are counted; inactive ones are kept as alternatives to swap in.
 * A pick with `roleId === SET_ROLE` is an all-in-one set: it is counted once, covers every role its stated contents
 * name, and carries its own `category` because a set can come from any organiser list.
 */
export interface PlanPick { roleId: string; id: string; qty: number; into: string; active: boolean; category?: string }
export const SET_ROLE = 'set';
export interface Plan { bagId: string; picks: PlanPick[] }

const KEY = 'ledger.pack.plan.v1';
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(): Plan | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p: unknown = JSON.parse(raw);
    if (!p || typeof p !== 'object' || !('picks' in p) || !Array.isArray((p as Plan).picks) || typeof (p as Plan).bagId !== 'string') return null;
    const plan = p as Plan;
    plan.picks = plan.picks.filter((k) => typeof k.roleId === 'string' && typeof k.id === 'string' && typeof k.into === 'string' && (k.roleId !== SET_ROLE || typeof k.category === 'string'))
      .map((k) => ({ ...k, qty: Math.max(1, Math.min(9, Math.round(Number(k.qty) || 1))), active: k.active !== false }));
    return plan;
  } catch { return null; }
}

let current: Plan | null = read();

function write(next: Plan | null) {
  current = next;
  try { if (next) localStorage.setItem(KEY, JSON.stringify(next)); else localStorage.removeItem(KEY); } catch { /* private mode */ }
  emit();
}

export function usePlan(bagId: string): PlanPick[] {
  const plan = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => current, () => current);
  return plan && plan.bagId === bagId ? plan.picks : EMPTY;
}
const EMPTY: PlanPick[] = [];

const picksOf = (bagId: string) => (current && current.bagId === bagId ? current.picks : []);

/** Add a listing to a role. The first pick of a role is active; later ones arrive as alternatives unless `activate`. */
export function addPick(bagId: string, roleId: string, id: string, into: string, qty = 1, activate = false, category?: string) {
  const picks = picksOf(bagId).filter((p) => !(p.roleId === roleId && p.id === id));
  const hasActive = picks.some((p) => p.roleId === roleId && p.active);
  const active = activate || !hasActive;
  const next = active ? picks.map((p) => (p.roleId === roleId ? { ...p, active: false } : p)) : picks;
  write({ bagId, picks: [...next, { roleId, id, qty, into, active, ...(category ? { category } : {}) }] });
}

export function removePick(bagId: string, roleId: string, id: string) {
  const rest = picksOf(bagId).filter((p) => !(p.roleId === roleId && p.id === id));
  // Removing the active pick promotes the first alternative so the role never silently goes uncounted.
  if (!rest.some((p) => p.roleId === roleId && p.active)) {
    const i = rest.findIndex((p) => p.roleId === roleId);
    if (i >= 0) rest[i] = { ...rest[i], active: true };
  }
  write({ bagId, picks: rest });
}

/** Make one alternative the counted pick for its role; the previous active pick stays as an alternative. */
export function activatePick(bagId: string, roleId: string, id: string) {
  write({ bagId, picks: picksOf(bagId).map((p) => (p.roleId === roleId ? { ...p, active: p.id === id } : p)) });
}

export function setQty(bagId: string, roleId: string, id: string, qty: number) {
  const q = Math.max(1, Math.min(9, Math.round(qty)));
  write({ bagId, picks: picksOf(bagId).map((p) => (p.roleId === roleId && p.id === id ? { ...p, qty: q } : p)) });
}

export function setInto(bagId: string, roleId: string, id: string, into: string) {
  write({ bagId, picks: picksOf(bagId).map((p) => (p.roleId === roleId && p.id === id ? { ...p, into } : p)) });
}

export function replacePicks(bagId: string, picks: PlanPick[]) { write({ bagId, picks }); }

export function clearPlan() { write(null); }
