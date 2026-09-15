/** Routine-editing tool: Gemini reads the user's saved steps from the page context and proposes changes to them — swap
 * the product, move the days/slot, retitle, or remove. Every step id must be one the page listed and every product id must
 * exist in the search index (twin of chat_api/tools/routine_edit.py). The result is surfaced as a `tool_payload` and lands
 * as PENDING diffs on the My routine page — nothing is changed by this call. */
import type { Manifest } from '../../../lib/types';
import type { RoutineStepContext } from '../../types';
import { productUrl, str, ToolError, type Json, type Tool } from './base';
import { parseDays } from './routine';

const SLOTS = ['am', 'pm'];
const OPS = ['replace', 'move', 'update', 'remove'];
const MAX_EDITS = 16;

export const EDIT_TOOL = 'edit_routine_steps';

const stepLine = (s: RoutineStepContext) =>
  `${s.id}: ${s.title} (${s.slot.toUpperCase()} · ${s.days.join('/')} · ${s.zone}${s.product ? ` · ${s.product.brand} ${s.product.title}` : ''})`;

export const editRoutineSteps: Tool = {
  name: EDIT_TOOL,
  surface: true,
  description:
    "Change steps that are ALREADY in the user's saved routine (listed in the page context with their step ids). Use it when "
    + 'the user asks to swap a product, move a step to other days or the other slot, rename it, change its note, or remove it. '
    + "op 'replace' needs product_id (a listing id from get_top_products / search_products in this conversation — never "
    + "invented) or the word 'none' to unpin the listing and keep the step; 'move' needs days and/or slot; 'update' takes any "
    + "of title, note, days, slot, product_id; 'remove' deletes the step and needs nothing else. Every change is shown to the "
    + 'user as a before/after diff they accept or reject — this call changes nothing by itself. To ADD new steps use propose_routine_steps instead. Call once with all the edits.',
  parameters: (_manifest: Manifest) => ({
    type: 'object',
    properties: {
      edits: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            step_id: { type: 'string', description: 'Id of a step exactly as listed in the page context' },
            op: { type: 'string', enum: OPS },
            product_id: { type: 'string', nullable: true, description: "Listing id from a tool result in this conversation, or 'none' to unpin the product (for 'replace' / 'update')" },
            days: { type: 'string', nullable: true, description: "Comma-separated weekdays from mon,tue,wed,thu,fri,sat,sun or 'daily' (for 'move' / 'update')" },
            slot: { type: 'string', nullable: true, enum: SLOTS, description: "am or pm (for 'move' / 'update')" },
            title: { type: 'string', nullable: true, description: "New short step name (for 'update')" },
            note: { type: 'string', nullable: true, description: "New note shown under the step (for 'update')" },
            why: { type: 'string', description: 'One sentence: why this change, plain words, no marketing' },
          },
          required: ['step_id', 'op', 'why'],
        },
      },
    },
    required: ['edits'],
  }),
  async run(args, ctx) {
    const raw = Array.isArray(args.edits) ? args.edits.slice(0, MAX_EDITS) : [];
    if (!raw.length) throw new ToolError('edits must be a non-empty array');
    const steps = ctx.page?.routineSteps ?? [];
    if (!steps.length) throw new ToolError('The user has no saved routine steps to edit — offer to build one with propose_routine_steps instead.');
    const index = await ctx.store.search();
    const accepted: Json[] = [];
    const rejected: Json[] = [];
    for (const entry of raw) {
      const e = (typeof entry === 'object' && entry !== null ? entry : {}) as Json;
      const stepId = str(e.step_id);
      const op = str(e.op);
      const target = steps.find((s) => s.id === stepId);
      const problems: string[] = [];
      if (!target) problems.push(`no step with id '${stepId}' in the routine — the steps are: ${steps.map(stepLine).join('; ')}`);
      if (!OPS.includes(op)) problems.push(`op must be one of ${OPS.join('/')} (got '${op}')`);
      const after: Json = {};
      if (target && OPS.includes(op) && op !== 'remove') {
        const productId = str(e.product_id);
        const daysRaw = str(e.days);
        const slot = str(e.slot);
        const title = str(e.title);
        const note = typeof e.note === 'string' ? e.note.trim() : null;
        if (op === 'replace' && !productId) problems.push("'replace' needs product_id");
        if (op === 'move' && !daysRaw && !slot) problems.push("'move' needs days and/or slot");
        if (productId && productId.toLowerCase() === 'none') {
          if (!target.product) problems.push('this step has no product to unpin');
          else after.product = null;
        } else if (productId) {
          const hit = index.get(productId, target.category);
          if (!hit) problems.push(`no listing with id '${productId}' in the dataset — use an id returned by a tool`);
          else if (target.product && hit.id === target.product.id) problems.push(`listing '${productId}' is already the product on this step`);
          else {
            after.category = hit.category;
            after.product = {
              id: hit.id, category: hit.category, brand: hit.brand, title: hit.title, rank: hit.rank, of: ctx.store.categoryMeta(hit.category)?.count ?? null,
              score: hit.score, priceInr: hit.price, store: hit.store, inciStatus: hit.inci, inciSourceKind: hit.inciSource, url: productUrl(ctx, hit.category, hit.id),
            };
          }
        }
        if (daysRaw) {
          const days = parseDays(daysRaw);
          if (!days.length) problems.push(`days '${daysRaw}' names no weekday`);
          else after.days = days;
        }
        if (slot) {
          if (!SLOTS.includes(slot)) problems.push(`slot must be am or pm (got '${slot}')`);
          else after.slot = slot;
        }
        if (title) after.title = title;
        if (note !== null && note !== '') after.note = note;
        if (!problems.length && !Object.keys(after).length) problems.push('the edit changes nothing');
      }
      if (problems.length) rejected.push({ step_id: stepId, title: target?.title ?? '(unknown step)', reasons: problems });
      else accepted.push({ step_id: stepId, op, before: target, after, why: str(e.why) });
    }
    return {
      edited: accepted.length, rejected: rejected.length, edits: accepted, problems: rejected,
      note: accepted.length
        ? 'These changes are now shown to the user as pending before/after diffs on the My routine page; nothing is applied until they accept. Say what you changed in one or two lines and mention anything you could not do.'
        : 'Nothing could be proposed — fix the problems and call again, or explain to the user what is missing.',
    };
  },
};
