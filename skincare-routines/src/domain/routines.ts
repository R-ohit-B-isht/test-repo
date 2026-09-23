import type { Routine } from '../lib/types';

export const ROUTINE_WEIGHTS = { evidence: 0.3, coverage: 0.24, adherence: 0.2, fit: 0.14, time: 0.12 } as const;
export type RoutineScoreKey = keyof typeof ROUTINE_WEIGHTS;

export const ROUTINE_CRITERIA: { key: RoutineScoreKey; label: string; hint: string }[] = [
  { key: 'evidence', label: 'Evidence & authorship', hint: 'Who is behind it — dermatology bodies score highest' },
  { key: 'coverage', label: 'Coverage of fundamentals', hint: 'Cleanse · SPF · moisturise · treat' },
  { key: 'adherence', label: 'Simplicity & adherence', hint: 'Can you actually keep it up' },
  { key: 'fit', label: 'Skin-type flexibility', hint: 'Works across skin types' },
  { key: 'time', label: 'Time cost', hint: 'Minutes per day' },
];

export const ROUTINE_CATEGORIES: Record<string, { label: string; blurb: string }> = {
  core: { label: 'Core daily', blurb: 'Dermatologist baselines — the routines everything else builds on.' },
  method: { label: 'Named method', blurb: 'Published methods with a name: Korean 10-step, skin cycling, slugging…' },
  concern: { label: 'Concern-driven', blurb: 'Built around one problem — acne, pigmentation, ageing, sensitivity.' },
  occasion: { label: 'Occasion', blurb: 'For a context: gym, travel, wedding week, monsoon, winter.' },
  global: { label: 'World style', blurb: 'Regional traditions transcribed as published — Japan, Korea, India, Morocco…' },
};
export const ROUTINE_CATEGORY_ORDER = ['core', 'method', 'concern', 'occasion', 'global'];

/** The 22-phase model, in the order a full routine would run them. */
export const PHASE_ORDER = [
  'REMOVE', 'CLEANSE', 'BATHE', 'EXFOLIATE', 'STEAM', 'TONE', 'ESSENCE', 'MIST', 'SERUM', 'RETINOID', 'SPOT', 'TREAT',
  'MASK', 'MASSAGE', 'COLD', 'EYE', 'SEAL', 'OIL', 'PROTECT', 'SHAVE', 'HABITS', 'CARE',
];

export type RoutineSortKey = 'score' | 'evidence' | 'coverage' | 'adherence' | 'stepsAsc' | 'stepsDesc';
export const ROUTINE_SORTS: Record<RoutineSortKey, { label: string; cmp: (a: Routine, b: Routine) => number }> = {
  score: { label: 'Overall score', cmp: (a, b) => b.score - a.score || b.scores.evidence - a.scores.evidence },
  evidence: { label: 'Evidence', cmp: (a, b) => b.scores.evidence - a.scores.evidence || b.score - a.score },
  coverage: { label: 'Coverage', cmp: (a, b) => b.scores.coverage - a.scores.coverage || b.score - a.score },
  adherence: { label: 'Simplicity', cmp: (a, b) => b.scores.adherence - a.scores.adherence || b.score - a.score },
  stepsAsc: { label: 'Fewest steps', cmp: (a, b) => a.stepsPerDay - b.stepsPerDay || b.score - a.score },
  stepsDesc: { label: 'Most steps', cmp: (a, b) => b.stepsPerDay - a.stepsPerDay || b.score - a.score },
};
export const isRoutineSort = (k: string | null): k is RoutineSortKey => !!k && k in ROUTINE_SORTS;

export interface RoutineFilter { categories: string[]; phases: string[]; maxSteps: number | null; query: string; sort: RoutineSortKey }

/** OR within categories, OR within phases, AND across; steps and text search are extra AND terms. */
export function filterRoutines(items: Routine[], f: RoutineFilter): Routine[] {
  const q = f.query.trim().toLowerCase();
  const out = items.filter((r) =>
    (f.categories.length === 0 || f.categories.includes(r.category)) &&
    (f.phases.length === 0 || f.phases.some((p) => r.phases.includes(p))) &&
    (f.maxSteps === null || r.stepsPerDay <= f.maxSteps) &&
    (!q || `${r.brand} ${r.model} ${r.source} ${r.author}`.toLowerCase().includes(q)),
  );
  return out.sort(ROUTINE_SORTS[f.sort].cmp);
}

/** Distinct hue per phase, spaced evenly so neighbours in the 22-phase order never look alike. */
export function phaseHue(phase: string) {
  const i = PHASE_ORDER.indexOf(phase);
  return i < 0 ? 0 : (i * 137.5) % 360;
}
