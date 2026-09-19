import type { CategoryMeta } from '../lib/types';
import { DAYS, type PlanZone, type Slot, type Step } from './model';

/** A step as the editor holds it: everything the plan stores except identity, origin and position. */
export type StepDraft = Omit<Step, 'id' | 'origin' | 'order'>;

export const blankStep = (slot: Slot, zone: PlanZone): StepDraft => ({ slot, zone, days: [...DAYS], title: '', category: null, product: null, note: '' });

/** Which ranked pages fit a plan zone, read from the manifest: face / body pages by zone (face+body pages fit either), hair pages by
 *  the placements their listings actually carry (scalp / lengths / beard). */
export function zoneMatches(c: CategoryMeta, zone: PlanZone): boolean {
  if (zone === 'face' || zone === 'body') return c.zone === zone || c.zone === 'both';
  return c.zone === 'hair' && (c.byScope[zone] ?? 0) > 0;
}
