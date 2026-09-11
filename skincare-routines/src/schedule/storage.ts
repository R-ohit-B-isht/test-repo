/** localStorage adapter for the routine plan (Memento: the store hands over a snapshot, this file persists/restores it).
 * Corrupt or unavailable storage yields the empty plan plus a flag — never an invented routine. */
import {
  EMPTY_PLAN, EMPTY_SETUP, isDay, isPlanZone, isSlot, SKIN_TYPES, type Plan, type Proposal, type Setup, type Step, type StepProduct,
} from './model';

const KEY = 'ledger.routine.v1';
const MAX_STEPS = 60;
const MAX_PROPOSALS = 60;

export interface Loaded { plan: Plan; ok: boolean }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const numOrNull = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const strOrNull = (v: unknown) => (typeof v === 'string' ? v : null);

export function validProduct(v: unknown): StepProduct | null {
  if (!isRecord(v) || typeof v.id !== 'string' || typeof v.category !== 'string' || typeof v.title !== 'string' || typeof v.url !== 'string') return null;
  return {
    id: v.id, category: v.category, brand: str(v.brand), title: v.title, rank: numOrNull(v.rank), of: numOrNull(v.of), score: numOrNull(v.score),
    priceInr: numOrNull(v.priceInr), store: strOrNull(v.store), inciStatus: strOrNull(v.inciStatus), inciSourceKind: strOrNull(v.inciSourceKind), url: v.url,
  };
}

function validStep(v: unknown): Step | null {
  if (!isRecord(v) || typeof v.id !== 'string' || !isSlot(v.slot) || !isPlanZone(v.zone) || typeof v.title !== 'string' || !Array.isArray(v.days)) return null;
  const days = v.days.filter(isDay);
  if (!days.length) return null;
  return {
    id: v.id, slot: v.slot, zone: v.zone, title: v.title, days: [...new Set(days)], category: strOrNull(v.category),
    product: validProduct(v.product), note: str(v.note), origin: v.origin === 'ai' ? 'ai' : 'user', order: typeof v.order === 'number' ? v.order : 0,
  };
}

function validProposal(v: unknown): Proposal | null {
  if (!isRecord(v) || typeof v.id !== 'string' || typeof v.createdAt !== 'number') return null;
  const step = validStep({ ...(isRecord(v.step) ? v.step : {}), id: v.id });
  if (!step) return null;
  const { id: _id, origin: _o, order: _n, ...rest } = step;
  void _id; void _o; void _n;
  const status = v.status === 'accepted' || v.status === 'rejected' ? v.status : 'pending';
  return { id: v.id, step: rest, why: str(v.why), status, createdAt: v.createdAt, batch: str(v.batch) };
}

function validSetup(v: unknown): Setup {
  if (!isRecord(v)) return EMPTY_SETUP;
  const zones = Array.isArray(v.zones) ? v.zones.filter(isPlanZone) : [];
  const skin = SKIN_TYPES.find((s) => s === v.skinType) ?? null;
  return {
    zones: zones.length ? [...new Set(zones)] : EMPTY_SETUP.zones,
    concerns: Array.isArray(v.concerns) ? v.concerns.filter((c): c is string => typeof c === 'string').slice(0, 12) : [],
    skinType: skin, maxPriceInr: numOrNull(v.maxPriceInr), notes: str(v.notes).slice(0, 600),
  };
}

export function load(): Loaded {
  let raw: string | null;
  try { raw = localStorage.getItem(KEY); } catch { return { plan: EMPTY_PLAN, ok: false }; }
  if (!raw) return { plan: EMPTY_PLAN, ok: true };
  try {
    const env = JSON.parse(raw) as Partial<Plan>;
    if (env.version !== 1) return { plan: EMPTY_PLAN, ok: true };
    const steps = (Array.isArray(env.steps) ? env.steps : []).map(validStep).filter((s): s is Step => s !== null).slice(0, MAX_STEPS);
    const proposals = (Array.isArray(env.proposals) ? env.proposals : []).map(validProposal).filter((p): p is Proposal => p !== null).slice(-MAX_PROPOSALS);
    return { plan: { version: 1, setup: validSetup(env.setup), steps, proposals, updatedAt: typeof env.updatedAt === 'number' ? env.updatedAt : 0 }, ok: true };
  } catch {
    return { plan: EMPTY_PLAN, ok: true };
  }
}

/** Returns false when the browser refused the write (private mode, quota) so the UI can say the routine is not being kept. */
export function save(plan: Plan): boolean {
  const bounded: Plan = { ...plan, steps: plan.steps.slice(0, MAX_STEPS), proposals: plan.proposals.slice(-MAX_PROPOSALS) };
  try { localStorage.setItem(KEY, JSON.stringify(bounded)); return true; } catch { return false; }
}
