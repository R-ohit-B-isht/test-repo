/** Which schedule tab a step belongs to (Face · Body · Hair · Teeth · Other), derived at render time from what the saved step
 * already carries — the same category → title → zone reading the "where to apply" guide uses — so routines saved before the
 * tabs existed split correctly without being rewritten. */
import { applicationGuide, type ApplicationArea, type GuidedStep } from './application';
import { AREA_OF_ZONE, AREAS, type Area, type Step } from './model';

const AREA_OF_APPLICATION: Record<ApplicationArea, Area> = {
  face: 'face', 'face-neck': 'face', 'face-neck-ears': 'face', spots: 'face', 'eye-contour': 'face', lips: 'face',
  body: 'body', underarms: 'body', feet: 'body',
  scalp: 'hair', lengths: 'hair', beard: 'hair',
  mouth: 'oral', other: 'other',
};

export function areaOf(step: GuidedStep): Area {
  const guide = applicationGuide(step);
  return guide.from === 'zone' ? AREA_OF_ZONE[step.zone] : AREA_OF_APPLICATION[guide.area];
}

export type AreaCounts = Record<Area, number>;

/** How many steps sit under each tab, in tab order (zero for areas the routine does not touch). */
export function areaCounts(steps: readonly GuidedStep[]): AreaCounts {
  const counts = Object.fromEntries(AREAS.map((a) => [a, 0])) as AreaCounts;
  for (const s of steps) counts[areaOf(s)]++;
  return counts;
}

/** The tabs worth showing: every area with at least one step, in the fixed Face → Body → Hair → Teeth → Other order. */
export const areasPresent = (steps: readonly GuidedStep[]): Area[] => {
  const counts = areaCounts(steps);
  return AREAS.filter((a) => counts[a] > 0);
};

export const stepsInArea = <T extends Step>(steps: readonly T[], area: Area | null): T[] =>
  area === null ? [...steps] : steps.filter((s) => areaOf(s) === area);
