/** The message that asks Gemini for a second opinion on a built plan, and the parser for the `review_routine_plan`
 * payload that comes back. A swapped pick is honoured only when it is one of the candidates the step was shown. */
import { REVIEW_TOOL } from '../../chat/local/tools/planReview';
import { DAY_LABEL, SLOT_LABEL, ZONE_LABEL, type Setup } from '../model';
import type { PickResult } from './picker';
import type { WeekPlan } from './scheduler';

export { REVIEW_TOOL };

export interface ReviewNote { why: string; pickId: string | null }
export interface Review { notes: Record<string, ReviewNote>; warnings: string[]; problems: string[] }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function reviewMessage(week: WeekPlan, picks: Record<string, PickResult>, setup: Setup, categoryLabel: (id: string) => string): string {
  const lines = ['Review this weekly plan my routine page built. Do not rebuild it; call review_routine_plan once with one note per step id.'];
  if (setup.skinType) lines.push(`Skin type: ${setup.skinType}.`);
  if (setup.concerns.length) lines.push(`Concerns: ${setup.concerns.join(', ')}.`);
  if (setup.maxPriceInr) lines.push(`Budget: at most ₹${setup.maxPriceInr.toLocaleString('en-IN')} per product.`);
  if (week.restNights.length) lines.push(`Rest nights (no actives): ${week.restNights.map((d) => DAY_LABEL[d]).join(', ')}.`);
  lines.push('Steps (id · slot · days · zone · page · pick, then the other candidates by id):');
  for (const step of week.steps) {
    const pick = picks[step.id];
    const chosen = pick?.chosen ? `${pick.chosen.brand} ${pick.chosen.title} [${pick.chosen.id}] #${pick.chosen.rank}${pick.chosen.of ? `/${pick.chosen.of}` : ''} ₹${pick.chosen.priceInr} INCI:${pick.chosen.inciStatus}` : 'no pick';
    const others = pick?.candidates.slice(1).map((c) => `${c.brand} ${c.title} [${c.id}] #${c.rank} ₹${c.priceInr} INCI:${c.inciStatus}`) ?? [];
    lines.push(`- ${step.id} · ${SLOT_LABEL[step.slot]} · ${step.days.length === 7 ? 'daily' : step.days.map((d) => DAY_LABEL[d]).join('/')} · ${ZONE_LABEL[step.zone]} · ${step.category ? categoryLabel(step.category) : 'no page'} · ${chosen}${step.carries.length ? ` · carries ${step.carries.join(', ')}` : ''}`);
    if (others.length) lines.push(`  candidates: ${others.join(' | ')}`);
  }
  if (week.warnings.length) lines.push('Planner warnings already shown to me — do not repeat or rephrase these; only add a warning for something new: ' + week.warnings.map((w) => w.text).join(' '));
  return lines.join('\n');
}

const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9+% ]+/g, ' ').split(/\s+/).filter((w) => w.length > 2));

/** True when the assistant's warning is just a rewording of one the planner already shows (≥ 60% shared words). */
export function echoesPlanner(text: string, planner: string[]): boolean {
  const a = words(text);
  if (!a.size) return true;
  return planner.some((p) => {
    const b = words(p);
    let shared = 0;
    for (const w of a) if (b.has(w)) shared++;
    return shared / a.size >= 0.6;
  });
}

/** Parses the tool payload; unknown step ids and pick ids outside the step's candidates are reported, never applied. */
export function reviewFrom(result: Record<string, unknown>, picks: Record<string, PickResult>, plannerWarnings: string[] = []): Review {
  const notes: Record<string, ReviewNote> = {};
  const problems = (Array.isArray(result.problems) ? result.problems : []).filter((p): p is string => typeof p === 'string');
  for (const entry of Array.isArray(result.notes) ? result.notes : []) {
    if (!isRecord(entry) || typeof entry.step !== 'string' || typeof entry.why !== 'string') continue;
    const pick = picks[entry.step];
    if (!pick) { problems.push(`${entry.step}: not a step in this plan`); continue; }
    let pickId: string | null = null;
    if (typeof entry.pickId === 'string' && entry.pickId) {
      if (pick.candidates.some((c) => c.id === entry.pickId)) pickId = entry.pickId;
      else problems.push(`${entry.step}: suggested listing '${entry.pickId}' was not among this step's candidates — pick kept`);
    }
    notes[entry.step] = { why: entry.why.trim(), pickId };
  }
  const warnings = (Array.isArray(result.warnings) ? result.warnings : [])
    .filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
    .filter((w) => !echoesPlanner(w, plannerWarnings));
  return { notes, warnings, problems };
}
