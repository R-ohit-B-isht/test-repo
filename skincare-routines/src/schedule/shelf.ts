/** The shelf is the routine's own pinned listings, one card per distinct product, with the steps that use it.
 * Derived on every render from `plan.steps` — nothing is stored, so existing routines get a shelf with no redo. */
import { SLOTS, stepsFor, type Step, type StepProduct } from './model';

export interface ShelfItem { product: StepProduct; steps: Step[] }

export function shelfFrom(steps: Step[]): ShelfItem[] {
  const byId = new Map<string, ShelfItem>();
  // Walk in the site's display order (morning then night, stored order) so the shelf reads like the day does.
  for (const slot of SLOTS) {
    for (const step of stepsFor(steps, slot, null)) {
      if (!step.product) continue;
      const item = byId.get(step.product.id);
      if (item) item.steps.push(step);
      else byId.set(step.product.id, { product: step.product, steps: [step] });
    }
  }
  return [...byId.values()];
}
