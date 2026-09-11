/** "My routine" domain: a weekly plan of AM / PM steps, each optionally pinned to a real listing on the site.
 * Product facts on a step are a snapshot copied from site data at the time it was added (id keeps the deep link live). */

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Day = (typeof DAYS)[number];
export const DAY_LABEL: Record<Day, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

export const SLOTS = ['am', 'pm'] as const;
export type Slot = (typeof SLOTS)[number];
export const SLOT_LABEL: Record<Slot, string> = { am: 'Morning', pm: 'Night' };

export const PLAN_ZONES = ['face', 'body', 'scalp', 'lengths', 'beard'] as const;
export type PlanZone = (typeof PLAN_ZONES)[number];
export const ZONE_LABEL: Record<PlanZone, string> = { face: 'Face', body: 'Body', scalp: 'Scalp', lengths: 'Hair lengths', beard: 'Beard' };

export const SKIN_TYPES = ['oily', 'combination', 'normal', 'dry', 'sensitive'] as const;
export type SkinType = (typeof SKIN_TYPES)[number];

/** Copied from a tool result / search hit — never typed in by hand or by the model. */
export interface StepProduct {
  id: string; category: string; brand: string; title: string;
  rank: number | null; of: number | null; score: number | null; priceInr: number | null; store: string | null;
  inciStatus: string | null; inciSourceKind: string | null; url: string;
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
}

export type ProposalStatus = 'pending' | 'accepted' | 'rejected';
export interface Proposal {
  id: string;
  step: Omit<Step, 'id' | 'origin' | 'order'>;
  why: string;
  status: ProposalStatus;
  createdAt: number;
  batch: string;
}

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
