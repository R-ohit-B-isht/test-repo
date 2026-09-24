import type { PackBag, PackCompartment, PackRole, PackSize, ProductRow } from '../lib/types';
import type { PlanPick } from '../state/planStore';

export type FitStatus = 'fits' | 'tight' | 'over' | 'empty';

/** One counted pick with its geometry resolved: litres per set × sets, or `null` when the listing states no accepted size. */
export interface PlacedPick {
  roleId: string;
  pick: PlanPick;
  row: ProductRow | null;
  litres: number | null;
  size: PackSize | null;
}

export interface CompartmentLoad {
  compartment: PackCompartment;
  rated: number;
  usable: number;
  /** Litres from sized active picks. */
  used: number;
  /** Active picks with no accepted size — they take space we cannot count. */
  unsized: number;
  remainingUsable: number;
  remainingRated: number;
  status: FitStatus;
  picks: PlacedPick[];
}

export interface PlanSummary {
  loads: CompartmentLoad[];
  /** Roles that have no active pick yet. */
  unfilled: PackRole[];
  status: FitStatus;
  /** Weakest evidence tier among counted sizes: a plan is only as verified as its least-verified size. */
  weakestTier: PackSize['tier'] | null;
  total: number;
  sizedPicks: number;
  unsizedPicks: number;
  cost: number;
}

/** Litres one pick occupies: the set estimate (largest stated piece + graded tail for the other pieces) × sets. */
export const litresOf = (size: PackSize, qty: number) => Math.round(size.s * qty * 10) / 10;

const TIER_RANK: Record<PackSize['tier'], number> = { official: 0, listing: 1, claimed: 2 };

export function statusFor(used: number, unsized: number, usable: number, rated: number): FitStatus {
  if (used === 0 && unsized === 0) return 'empty';
  if (used > rated) return 'over';
  if (used > usable) return 'tight';
  return 'fits';
}

/**
 * Pure arithmetic on stated sizes: every active pick is a rectangular box (largest stated piece × piece count × sets)
 * charged to the compartment it is assigned to. `usable` is the conservative planning budget; `rated` is the maker's
 * litre figure. Nothing here proves a physical fit — see `PackBag.caveats`.
 */
export function summarise(bag: PackBag, picks: PlanPick[], rowOf: (category: string, id: string) => ProductRow | undefined): PlanSummary {
  const loads: CompartmentLoad[] = bag.compartments.map((c) => ({
    compartment: c, rated: c.litres, usable: Math.round(c.litres * c.usable * 10) / 10, used: 0, unsized: 0,
    remainingUsable: 0, remainingRated: 0, status: 'empty', picks: [],
  }));
  let weakest: PackSize['tier'] | null = null;
  let cost = 0; let sized = 0; let unsized = 0;
  for (const p of picks) {
    if (!p.active) continue;
    const role = bag.roles.find((r) => r.id === p.roleId);
    if (!role) continue;
    const load = loads.find((l) => l.compartment.id === p.into) ?? loads[0];
    const row = rowOf(role.category, p.id);
    const size = row?.pk ?? null;
    const litres = size ? litresOf(size, p.qty) : null;
    load.picks.push({ roleId: p.roleId, pick: p, row: row ?? null, litres, size });
    if (litres !== null && size) {
      load.used = Math.round((load.used + litres) * 10) / 10;
      sized++;
      if (weakest === null || TIER_RANK[size.tier] > TIER_RANK[weakest]) weakest = size.tier;
    } else { load.unsized++; unsized++; }
    if (row) cost += row.p * p.qty;
  }
  let status: FitStatus = 'empty';
  for (const l of loads) {
    l.remainingUsable = Math.round((l.usable - l.used) * 10) / 10;
    l.remainingRated = Math.round((l.rated - l.used) * 10) / 10;
    l.status = statusFor(l.used, l.unsized, l.usable, l.rated);
    status = worse(status, l.status);
  }
  const filled = new Set(picks.filter((p) => p.active).map((p) => p.roleId));
  return { loads, unfilled: bag.roles.filter((r) => !filled.has(r.id)), status, weakestTier: weakest, total: loads.reduce((n, l) => n + l.used, 0), sizedPicks: sized, unsizedPicks: unsized, cost };
}

const ORDER: FitStatus[] = ['empty', 'fits', 'tight', 'over'];
const worse = (a: FitStatus, b: FitStatus) => (ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a);

export const FIT_META: Record<FitStatus, { label: string; tone: 'good' | 'warn' | 'bad' | 'muted'; hint: string }> = {
  fits: { label: 'Fits the budget', tone: 'good', hint: 'Counted volume is inside the conservative 80 % budget of every compartment' },
  tight: { label: 'Tight', tone: 'warn', hint: 'Inside the maker’s rated litres but over the 80 % budget rigid organisers can realistically take' },
  over: { label: 'Over capacity', tone: 'bad', hint: 'Counted volume exceeds the maker’s rated litres for a compartment' },
  empty: { label: 'Nothing placed yet', tone: 'muted', hint: 'Pick an organiser for each role to see the fit' },
};

/**
 * Best-scored candidate per role that has an accepted, non-claimed size and still fits the compartment's usable budget
 * after the picks already placed. Greedy in role order; returns the picks it could not fill so the UI can say so.
 */
export function autoFill(bag: PackBag, current: PlanPick[], rowsOf: (category: string) => ProductRow[] | undefined): { picks: PlanPick[]; unfilled: PackRole[] } {
  const picks = current.filter((p) => p.active);
  const used = new Map<string, number>();
  for (const p of picks) {
    const role = bag.roles.find((r) => r.id === p.roleId);
    const row = role ? rowsOf(role.category)?.find((r) => r.id === p.id) : undefined;
    if (row?.pk) used.set(p.into, (used.get(p.into) ?? 0) + litresOf(row.pk, p.qty));
  }
  const unfilled: PackRole[] = [];
  const taken = new Set(picks.map((p) => p.id));
  for (const role of bag.roles) {
    if (picks.some((p) => p.roleId === role.id)) continue;
    const comp = bag.compartments.find((c) => c.id === role.into) ?? bag.compartments[0];
    const budget = comp.litres * comp.usable - (used.get(comp.id) ?? 0);
    const rows = rowsOf(role.category);
    if (!rows) { unfilled.push(role); continue; }
    const best = [...rows]
      .filter((r) => r.pk && r.pk.tier !== 'claimed' && !taken.has(r.id) && litresOf(r.pk, role.qty) <= budget)
      .sort((a, b) => b.s - a.s || a.p - b.p)[0];
    if (!best?.pk) { unfilled.push(role); continue; }
    picks.push({ roleId: role.id, id: best.id, qty: role.qty, into: comp.id, active: true });
    taken.add(best.id);
    used.set(comp.id, (used.get(comp.id) ?? 0) + litresOf(best.pk, role.qty));
  }
  return { picks: [...current.filter((p) => !p.active), ...picks], unfilled };
}

export const litres = (v: number) => `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} L`;
export const dims = (d: PackSize['d']) => `${d.map((x) => (x % 1 === 0 ? x.toFixed(0) : x.toFixed(1))).join(' × ')} cm`;
