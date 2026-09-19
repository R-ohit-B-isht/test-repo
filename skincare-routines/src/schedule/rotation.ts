/** Weekly rotation, resolved at render time: which of a step's variants is on this week, which comes next. Nothing here
 * writes to the plan — a step without `rotation` resolves to itself, so every routine saved before rotation existed
 * reads exactly as it did. Weeks run Monday to Sunday in local time, like the schedule views. */
import type { Rotation, Step, StepVariant } from './model';
import { dateKey } from './week';

export const MAX_ALTERNATIVES = 5;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Local Monday of the week containing `d`, as a `YYYY-MM-DD` key — the unit rotation counts in. */
export function weekMonday(d: Date): string {
  return dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)));
}

/** Monday key shifted by whole weeks (`+1` → next week). */
export function shiftWeek(monday: string, weeks: number): string {
  const [y, m, d] = monday.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + weeks * 7));
}

/** The step's own fields as variant 1. */
export const baseVariant = (step: Pick<Step, 'title' | 'category' | 'product' | 'note'>): StepVariant =>
  ({ title: step.title, category: step.category, product: step.product, note: step.note });

/** Week 1 first, then the alternatives — the whole cycle, in order. */
export const cycleOf = (step: Pick<Step, 'title' | 'category' | 'product' | 'note' | 'rotation'>): StepVariant[] =>
  [baseVariant(step), ...(step.rotation?.alternatives ?? [])];

/** 0-based position in the cycle for the week starting `monday`; whole weeks from the anchor, wrapped, never negative. */
export function cycleIndex(rotation: Rotation, monday: string, length: number): number {
  if (length <= 1) return 0;
  const [ay, am, ad] = rotation.anchor.split('-').map(Number);
  const [my, mm, md] = monday.split('-').map(Number);
  const weeks = Math.round((Date.UTC(my, mm - 1, md) - Date.UTC(ay, am - 1, ad)) / WEEK_MS);
  return ((weeks % length) + length) % length;
}

export interface WeekView {
  /** The variant on this week — for a non-rotating step, the step itself. */
  now: StepVariant;
  /** Present only when the step rotates. */
  rotation: { index: number; total: number; next: StepVariant } | null;
}

/** What a step shows for the week starting `monday`. */
export function viewForWeek(step: Step, monday: string): WeekView {
  const cycle = cycleOf(step);
  if (!step.rotation || cycle.length < 2) return { now: cycle[0], rotation: null };
  const index = cycleIndex(step.rotation, monday, cycle.length);
  return { now: cycle[index], rotation: { index, total: cycle.length, next: cycle[(index + 1) % cycle.length] } };
}

/** Anchor that makes `cycle[index]` the variant on the week starting `monday`. */
export function anchorFor(monday: string, index: number): string {
  return shiftWeek(monday, -index);
}

/** The step with this week's variant swapped in — for guides and text that read `title` / `category` / `product`. */
export function stepForWeek(step: Step, monday: string): Step {
  const { now, rotation } = viewForWeek(step, monday);
  return !rotation || rotation.index === 0 ? step : { ...step, ...now };
}
