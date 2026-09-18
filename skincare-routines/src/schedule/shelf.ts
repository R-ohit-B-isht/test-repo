import { SLOTS, stepsFor, type Step, type StepProduct } from './model';
import { cycleOf, viewForWeek } from './rotation';

export interface ShelfUse {
  step: Step;
  /** For a rotating step: which week of the cycle this product is on (1-based) and whether that is the current week. */
  week: { index: number; total: number; now: boolean } | null;
}

export interface ShelfItem {
  product: StepProduct;
  uses: ShelfUse[];
  /** True when at least one step uses this product in the week starting `monday`. */
  inUseNow: boolean;
}

/** One card per real listing pinned anywhere in the routine — including the alternatives of rotating steps, since you
 * need those on the shelf too even when they're off this week. */
export function shelfFrom(steps: Step[], monday: string): ShelfItem[] {
  const byId = new Map<string, ShelfItem>();
  const add = (product: StepProduct, use: ShelfUse) => {
    const item = byId.get(product.id);
    const now = !use.week || use.week.now;
    if (item) { item.uses.push(use); item.inUseNow ||= now; }
    else byId.set(product.id, { product, uses: [use], inUseNow: now });
  };

  for (const slot of SLOTS) {
    for (const step of stepsFor(steps, slot, null)) {
      const cycle = cycleOf(step);
      if (cycle.length < 2 || !step.rotation) {
        if (step.product) add(step.product, { step, week: null });
        continue;
      }
      const { rotation } = viewForWeek(step, monday);
      cycle.forEach((variant, i) => {
        if (variant.product) add(variant.product, { step, week: { index: i + 1, total: cycle.length, now: rotation?.index === i } });
      });
    }
  }

  return [...byId.values()];
}
