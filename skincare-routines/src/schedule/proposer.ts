/** Turns the plan setup into the question sent to Gemini, and a `propose_routine_steps` tool payload back into pending
 * proposals. Every product on a proposal was already validated against the search index by the tool; this side only
 * re-checks shape so a malformed payload degrades to "nothing proposed", never to an invented step. */
import { PROPOSE_TOOL } from '../chat/local/tools/routine';
import { validProduct } from './storage';
import {
  DAY_LABEL, isDay, isPlanZone, isSlot, newId, SLOT_LABEL, ZONE_LABEL, type Plan, type Proposal, type Slot, type Step,
} from './model';

export { PROPOSE_TOOL };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export interface FillScope { slot: Slot | null; zone: Step['zone'] | null }

/** Follow-up when the model described a routine in prose but never filed it through the tool. */
export const NUDGE_MESSAGE =
  `You described the steps but did not call ${PROPOSE_TOOL}, so nothing reached my routine. Call ${PROPOSE_TOOL} now with exactly the steps you just listed — look the products up again with get_top_products / search_products if you need their ids (null where you found none) — then reply with one short line.`;

/** The question the routine page sends. Written as the user would say it so the same prompt rules apply from the chat drawer. */
export function fillMessage(plan: Plan, scope: FillScope, categoryLabel: (id: string) => string): string {
  const { setup } = plan;
  const zones = scope.zone ? [scope.zone] : setup.zones;
  const lines = [
    `Fill my ${scope.slot ? SLOT_LABEL[scope.slot].toLowerCase() : 'weekly AM/PM'} routine for: ${zones.map((z) => ZONE_LABEL[z]).join(', ')}.`,
  ];
  if (setup.skinType) lines.push(`Skin type: ${setup.skinType}.`);
  if (setup.concerns.length) lines.push(`Concerns: ${setup.concerns.join(', ')}.`);
  if (setup.maxPriceInr) lines.push(`Budget: at most ₹${setup.maxPriceInr.toLocaleString('en-IN')} per product.`);
  if (setup.notes.trim()) lines.push(`Notes from me: ${setup.notes.trim()}`);
  const existing = plan.steps.filter((s) => (!scope.slot || s.slot === scope.slot) && zones.includes(s.zone));
  if (existing.length) {
    lines.push('Already in my routine (do not propose these again; fit around them):');
    for (const s of existing) {
      const prod = s.product ? ` — ${s.product.brand} ${s.product.title} (id ${s.product.id})` : '';
      lines.push(`- ${SLOT_LABEL[s.slot]} · ${s.days.map((d) => DAY_LABEL[d]).join('/')} · ${ZONE_LABEL[s.zone]}: ${s.title}${s.category ? ` [${categoryLabel(s.category)}]` : ''}${prod}`);
    }
  }
  lines.push(
    `Look up the top ranked listings for each step's category (call get_top_products for all categories you need in one go), then call ${PROPOSE_TOOL} once with the complete set of steps${scope.slot ? ` for the ${SLOT_LABEL[scope.slot].toLowerCase()} slot only` : ''}. Keep the written answer to a short summary.`,
  );
  return lines.join('\n');
}

/** Parse the tool payload (`{steps:[{title,slot,days,zone,category,product,why}], problems:[...]}`) into pending proposals. */
export function proposalsFrom(result: Record<string, unknown>, batch: string): Proposal[] {
  const raw = Array.isArray(result.steps) ? result.steps : [];
  const now = Date.now();
  const out: Proposal[] = [];
  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry.title !== 'string' || !isSlot(entry.slot) || !isPlanZone(entry.zone) || !Array.isArray(entry.days)) continue;
    const days = [...new Set(entry.days.filter(isDay))];
    if (!days.length) continue;
    out.push({
      id: newId(), status: 'pending', createdAt: now, batch,
      why: typeof entry.why === 'string' ? entry.why : '',
      step: {
        slot: entry.slot, zone: entry.zone, title: entry.title.trim(), days,
        category: typeof entry.category === 'string' ? entry.category : null,
        product: validProduct(entry.product), note: '',
      },
    });
  }
  return out;
}

/** Problems the tool reported back (steps it refused because the id was invented, the slot was wrong…). */
export function problemsFrom(result: Record<string, unknown>): string[] {
  const raw = Array.isArray(result.problems) ? result.problems : [];
  return raw.flatMap((p) => (isRecord(p) && Array.isArray(p.reasons)
    ? [`${typeof p.title === 'string' ? p.title : 'A step'}: ${p.reasons.filter((r): r is string => typeof r === 'string').join('; ')}`]
    : []));
}

/** Human status line for the tool currently running (Google Fit / Headspace "preparing" copy, but truthful about what runs). */
export function toolStatus(name: string, args: Record<string, unknown>, categoryLabel: (id: string) => string): string {
  switch (name) {
    case 'get_ingredient_knowledge': return 'Checking ingredient pairing evidence…';
    case 'get_top_products': return typeof args.category === 'string' ? `Ranking ${categoryLabel(args.category)}…` : 'Ranking listings…';
    case 'search_products': return typeof args.query === 'string' ? `Searching “${args.query}”…` : 'Searching listings…';
    case 'get_category_filters': return 'Reading category filters…';
    case PROPOSE_TOOL: return 'Validating proposed products against site data…';
    default: return 'Reading site data…';
  }
}
