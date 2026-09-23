/** Turns the plan setup into the question sent to Gemini, and a `propose_routine_steps` tool payload back into pending
 * proposals. Every product on a proposal was already validated against the search index by the tool; this side only
 * re-checks shape so a malformed payload degrades to "nothing proposed", never to an invented step. */
import { PROPOSE_TOOL } from '../chat/local/tools/routine';
import { EDIT_TOOL } from '../chat/local/tools/routineEdit';
import type { RoutineOptionContext, RoutineStepContext } from '../chat/types';
import { areaOf } from './area';
import { isEditOp, validProduct, validVariant, withRotation } from './storage';
import { anchorFor, cycleOf, MAX_ALTERNATIVES, viewForWeek, weekMonday } from './rotation';
import {
  DAY_LABEL, isDay, isPlanZone, isSlot, newId, positionOf, SLOT_LABEL, ZONE_LABEL, type Plan, type Proposal, type Rotation, type Slot, type Step, type StepVariant,
} from './model';

export { EDIT_TOOL, PROPOSE_TOOL };

const optionContext = (v: StepVariant): RoutineOptionContext =>
  ({ title: v.title, product: v.product ? { id: v.product.id, brand: v.product.brand, title: v.product.title } : null });

/** The accepted steps as the assistant sees them in the page context (ids included so it can name a step to edit). A rotating
 *  step is shown as this week's option with the whole cycle alongside (one option per week, never used together); `missing`
 *  is the shelf's "not with me" set so the model can read and change what the user has. */
export const stepsForContext = (steps: Step[], monday = weekMonday(new Date()), missing: ReadonlySet<string> = new Set()): RoutineStepContext[] =>
  [...steps].sort((a, b) => (a.slot === b.slot ? a.order - b.order : a.slot === 'am' ? -1 : 1)).slice(0, 60).map((s) => {
    const { now, rotation } = viewForWeek(s, monday);
    return {
      id: s.id, title: now.title, slot: s.slot, position: positionOf(steps, s.id) ?? 1, days: s.days, zone: s.zone,
      part: areaOf({ title: now.title, category: now.category, zone: s.zone }), category: now.category,
      note: now.note,
      product: now.product ? { id: now.product.id, category: now.product.category, brand: now.product.brand, title: now.product.title, rank: now.product.rank } : null,
      withMe: now.product ? !missing.has(now.product.id) : null,
      rotation: rotation ? { active: rotation.index + 1, options: cycleOf(s).map(optionContext) } : null,
    };
  });

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

/** Parse an `edit_routine_steps` payload (`{edits:[{step_id,op,after:{...},why}]}`) into pending edit proposals. Each edit is
 * bound to a step that exists in `steps` right now; the proposal's `step` is that step with the change applied, so the card
 * can show before → after. Edits whose target has gone are dropped, never re-targeted. */
export function editsFrom(result: Record<string, unknown>, batch: string, steps: Step[], monday = weekMonday(new Date())): Proposal[] {
  const raw = Array.isArray(result.edits) ? result.edits : [];
  const now = Date.now();
  const out: Proposal[] = [];
  for (const entry of raw) {
    if (!isRecord(entry) || typeof entry.step_id !== 'string' || !isEditOp(entry.op)) continue;
    const target = steps.find((s) => s.id === entry.step_id);
    if (!target) continue;
    const after = isRecord(entry.after) ? entry.after : {};
    const days = Array.isArray(after.days) ? [...new Set(after.days.filter(isDay))] : target.days;
    if (!days.length) continue;
    const product = 'product' in after ? validProduct(after.product) : target.product;
    const from = positionOf(steps, target.id) ?? 1;
    const to = typeof after.position === 'number' && Number.isInteger(after.position) && after.position >= 1 ? after.position : null;
    if (entry.op === 'reorder' && to === null) continue;
    const owned = entry.op === 'owned' ? ownedFrom(after, target) : null;
    if (entry.op === 'owned' && !owned) continue;
    const rotation = entry.op === 'rotate' || entry.op === 'stop_rotation' ? rotationFrom(entry.op, after, target, monday) : { base: null, rotation: target.rotation };
    if (!rotation) continue;
    const before = withRotation({ title: target.title, slot: target.slot, zone: target.zone, days: target.days, category: target.category, product: target.product, note: target.note }, target.rotation);
    out.push({
      id: newId(), status: 'pending', createdAt: now, batch,
      why: typeof entry.why === 'string' ? entry.why : '',
      edit: {
        op: entry.op, targetStepId: target.id, before,
        ...(to !== null ? { position: { from, to } } : {}),
        ...(owned ? { owned } : {}),
      },
      step: withRotation({
        slot: isSlot(after.slot) ? after.slot : target.slot, zone: isPlanZone(after.zone) ? after.zone : target.zone, days,
        title: rotation.base?.title ?? (typeof after.title === 'string' && after.title.trim() ? after.title.trim() : target.title),
        category: rotation.base ? rotation.base.category : typeof after.category === 'string' ? after.category : after.category === null ? null : target.category,
        product: rotation.base ? rotation.base.product : product,
        note: rotation.base ? rotation.base.note : typeof after.note === 'string' ? after.note : target.note,
      }, rotation.rotation),
    });
  }
  return out;
}

/** `after.owned` names the pinned listing and the direction; the step itself is untouched by this kind of edit. */
function ownedFrom(after: Record<string, unknown>, target: Step): { productId: string; have: boolean } | null {
  if (typeof after.owned !== 'boolean' || !target.product) return null;
  return { productId: target.product.id, have: after.owned };
}

/** The cycle after a `rotate` / `stop_rotation` edit. `after.rotation` is `{options:[variant…], active}` — option 1 becomes the
 * step's own fields (`base`), options 2…n the alternatives, `active` (1-based) the one on the week starting `monday`. A stop
 * keeps the chosen option as the step's only fields. A cycle that fails to parse yields null and the edit is dropped. */
function rotationFrom(op: 'rotate' | 'stop_rotation', after: Record<string, unknown>, target: Step, monday: string): { base: StepVariant | null; rotation: Rotation | undefined } | null {
  const spec = isRecord(after.rotation) ? after.rotation : {};
  const options = Array.isArray(spec.options) ? spec.options.map(validVariant).filter((v): v is StepVariant => v !== null) : cycleOf(target);
  const active = typeof spec.active === 'number' && Number.isInteger(spec.active) && spec.active >= 1 && spec.active <= options.length ? spec.active : 1;
  if (op === 'stop_rotation') return options.length ? { base: options[active - 1], rotation: undefined } : null;
  if (options.length < 2 || options.length > MAX_ALTERNATIVES + 1) return null;
  return { base: options[0], rotation: { anchor: anchorFor(monday, active - 1), alternatives: options.slice(1) } };
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
    case EDIT_TOOL: return 'Checking the changes against your routine…';
    default: return 'Reading site data…';
  }
}
