/** "My routine" domain: a weekly plan of AM / PM steps, each optionally pinned to a real listing on the site.
 * Product facts on a step are a snapshot copied from site data at the time it was added (id keeps the deep link live). */

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];
export const DAY_LABEL: Record<Day, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

export const SLOTS = ['am', 'pm'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_LABEL: Record<Slot, string> = { am: 'Morning', pm: 'Night' };

/** Where a step goes. The first five are what the planner can fill from ranked pages; `oral` and `other` exist for steps the
 * site has no pages for (brushing, flossing, nails…) so they still get their own place in the schedule. */
export const PLAN_ZONES = ['face', 'body', 'scalp', 'lengths', 'beard', 'oral', 'other'] as const;
export type PlanZone = (typeof PLAN_ZONES)[number];
export const ZONE_LABEL: Record<PlanZone, string> = { face: 'Face', body: 'Body', scalp: 'Scalp', lengths: 'Hair lengths', beard: 'Beard', oral: 'Teeth & mouth', other: 'Other' };
/** Zones the planner and Setup offer — the ones with ranked pages behind them. */
export const PLANNER_ZONES: readonly PlanZone[] = ['face', 'body', 'scalp', 'lengths', 'beard'];

/** The tabs the schedule is split by: zones grouped into body areas (scalp / lengths / beard → hair). */
export const AREAS = ['face', 'body', 'hair', 'oral', 'other'] as const;
export type Area = (typeof AREAS)[number];
export const AREA_LABEL: Record<Area, string> = { face: 'Face', body: 'Body', hair: 'Hair', oral: 'Teeth', other: 'Other' };
export const AREA_OF_ZONE: Record<PlanZone, Area> = { face: 'face', body: 'body', scalp: 'hair', lengths: 'hair', beard: 'hair', oral: 'oral', other: 'other' };
export const isArea = (v: unknown): v is Area => typeof v === 'string' && (AREAS as readonly string[]).includes(v);

export const SKIN_TYPES = ['oily', 'combination', 'normal', 'dry', 'sensitive'] as const;
export type SkinType = (typeof SKIN_TYPES)[number];

/** Copied from a tool result / search hit — never typed in by hand or by the model. */
export interface StepProduct {
  id: string; category: string; brand: string; title: string;
  rank: number | null; of: number | null; score: number | null; priceInr: number | null; store: string | null;
  inciStatus: string | null; inciSourceKind: string | null; url: string;
}

/** What changes from week to week inside a rotating step: the name, the page it links to, the pinned listing, the note.
 * Slot, days and zone stay the step's own. */
export interface StepVariant {
  title: string;
  category: string | null;
  product: StepProduct | null;
  note: string;
}

/** A step that alternates week by week (e.g. azelaic → retinol → azelaic …). The step's own title / category / product /
 * note are week 1; `alternatives` are weeks 2…n; `anchor` is the local `YYYY-MM-DD` Monday of a week 1. Optional and absent
 * on every step saved before this existed — such steps read exactly as before. */
export interface Rotation {
  anchor: string;
  alternatives: StepVariant[];
}

export interface Step {
  id: string;
  slot: Slot;
  days: Day[];
  zone: PlanZone;
  title: string;
  category: string | null;
  product: StepProduct | null;
  note: string;
  origin: 'user' | 'ai';
  order: number;
  rotation?: Rotation;
}

export type ProposalStatus = 'pending' | 'accepted' | 'rejected';
export type EditOp = 'replace' | 'move' | 'update' | 'remove' | 'reorder' | 'rotate' | 'stop_rotation' | 'owned';
/** A proposal that changes an existing step instead of adding one: `step` holds the step as it would look after the change
 * (its `rotation` is the cycle after the change — absent once a rotation is stopped). */
export interface StepEdit {
  op: EditOp;
  targetStepId: string;
  /** The target as it was when proposed — shown as the "before" half of the diff and used to notice it changed since. */
  before: Omit<Step, 'id' | 'origin' | 'order'>;
  /** 1-based place among the steps of the slot the step ends up in — `from` as proposed, `to` as requested. */
  position?: { from: number; to: number };
  /** `owned` edits: the pinned listing to mark as with the user (`have`) or not — applied to the shelf note, never to the step. */
  owned?: { productId: string; have: boolean };
}
export interface Proposal {
  id: string;
  step: Omit<Step, 'id' | 'origin' | 'order'>;
  why: string;
  status: ProposalStatus;
  createdAt: number;
  batch: string;
  /** Present on edit proposals; absent (or undefined) on plain "add this step" ones. */
  edit?: StepEdit;
}

export const EDIT_VERB: Record<EditOp, string> = {
  replace: 'Swap product', move: 'Move', update: 'Change', remove: 'Remove', reorder: 'Reorder', rotate: 'Rotate weekly', stop_rotation: 'Stop rotating', owned: 'Shelf',
};

/** The card heading verb — `owned` edits say which way the shelf note goes. */
export const editVerb = (edit: StepEdit): string =>
  edit.op === 'owned' && edit.owned ? (edit.owned.have ? 'Mark with me' : 'Mark not with me') : EDIT_VERB[edit.op];

/** 1-based place of a step among the steps sharing its slot (the order the timeline shows them in). */
export const positionOf = (steps: Step[], id: string): number | null => {
  const me = steps.find((s) => s.id === id);
  if (!me) return null;
  return stepsFor(steps, me.slot, null).findIndex((s) => s.id === id) + 1;
};

export interface Setup {
  zones: PlanZone[];
  concerns: string[];
  skinType: SkinType | null;
  maxPriceInr: number | null;
  notes: string;
}

export interface Plan {
  version: 1;
  setup: Setup;
  steps: Step[];
  proposals: Proposal[];
  updatedAt: number;
}

export const EMPTY_SETUP: Setup = { zones: ['face'], concerns: [], skinType: null, maxPriceInr: null, notes: '' };
export const EMPTY_PLAN: Plan = { version: 1, setup: EMPTY_SETUP, steps: [], proposals: [], updatedAt: 0 };

export const newId = (): string =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);

export const isDay = (v: unknown): v is Day => typeof v === 'string' && (DAYS as readonly string[]).includes(v);
export const isSlot = (v: unknown): v is Slot => typeof v === 'string' && (SLOTS as readonly string[]).includes(v);
export const isPlanZone = (v: unknown): v is PlanZone => typeof v === 'string' && (PLAN_ZONES as readonly string[]).includes(v);

export const stepsFor = (steps: Step[], slot: Slot, day: Day | null) =>
  steps.filter((s) => s.slot === slot && (day === null || s.days.includes(day))).sort((a, b) => a.order - b.order);

export const daysSummary = (days: Day[]): string => {
  if (days.length === 7) return 'Every day';
  if (days.length === 0) return 'No days';
  const set = new Set(days);
  if (days.length === 5 && ['mon', 'tue', 'wed', 'thu', 'fri'].every((d) => set.has(d as Day))) return 'Weekdays';
  if (days.length === 2 && set.has('sat') && set.has('sun')) return 'Weekends';
  return DAYS.filter((d) => set.has(d)).map((d) => DAY_LABEL[d]).join(' · ');
};

/** Plain-text export of accepted steps (for clipboard / notes apps). */
export function planAsText(plan: Plan, categoryLabel: (id: string) => string): string {
  const lines: string[] = ['My routine — Skin Ledger', ''];
  for (const slot of SLOTS) {
    const steps = stepsFor(plan.steps, slot, null);
    if (!steps.length) continue;
    lines.push(`${SLOT_LABEL[slot].toUpperCase()}`);
    steps.forEach((s, i) => {
      const cat = s.category ? ` · ${categoryLabel(s.category)}` : '';
      const prod = s.product ? ` — ${s.product.brand} ${s.product.title}${s.product.rank ? ` (#${s.product.rank} of ${s.product.of})` : ''}` : '';
      lines.push(`${i + 1}. ${s.title} [${ZONE_LABEL[s.zone]}${cat}] · ${daysSummary(s.days)}${prod}`);
      if (s.note) lines.push(`   ${s.note}`);
    });
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}
