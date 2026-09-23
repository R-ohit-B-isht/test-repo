/** Routine-editing tool: Gemini reads the user's saved steps from the page context and proposes changes to them — swap
 * the product, move the days/slot, reorder within the slot, retitle, remove, set up / change / stop a weekly rotation of
 * products on a step, or note a pinned product as with / not with the user. Every step id must be one the page listed and
 * every product id must exist in the search index (twin of chat_api/tools/routine_edit.py). The result is surfaced as a
 * `tool_payload` and lands as PENDING diffs on the My routine page — nothing is changed by this call. */
import type { Manifest } from '../../../lib/types';
import type { RoutineStepContext } from '../../types';
import { MAX_ALTERNATIVES } from '../../../schedule/rotation';
import type { Hit, SearchIndex } from '../search';
import { productUrl, str, ToolError, type Json, type Tool, type ToolContext } from './base';
import { parseDays, ZONES, NO_PAGE_ZONES } from './routine';

const SLOTS = ['am', 'pm'];
const OPS = ['replace', 'move', 'update', 'remove', 'reorder', 'rotate', 'stop_rotation', 'owned'];
const MAX_EDITS = 16;
const MAX_OPTIONS = MAX_ALTERNATIVES + 1;

export const EDIT_TOOL = 'edit_routine_steps';

const stepLine = (s: RoutineStepContext) =>
  `${s.id}: ${s.title} (${s.slot.toUpperCase()} #${s.position} · ${s.days.join('/')} · ${s.zone}${s.product ? ` · ${s.product.brand} ${s.product.title}` : ''})`;

/** Parses `active`: a 1-based option number inside a cycle of `total`; null (no problem) when absent. */
function checkActive(raw: unknown, total: number, problems: string[]): number | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() ? Number(raw) : NaN;
  if (!Number.isInteger(n) || n < 1 || n > total) { problems.push(`active must be an option number from 1 to ${total} (got '${String(raw)}')`); return null; }
  return n;
}

/** The snapshot of a listing pinned to a step or a rotation option (same shape the routine stores). */
function pinned(ctx: ToolContext, hit: Hit): Json {
  return {
    id: hit.id, category: hit.category, brand: hit.brand, title: hit.title, rank: hit.rank, of: ctx.store.categoryMeta(hit.category)?.count ?? null,
    score: hit.score, priceInr: hit.price, store: hit.store, inciStatus: hit.inci, inciSourceKind: hit.inciSource, url: productUrl(ctx, hit.category, hit.id),
  };
}

/** One rotation option as the model sends it: the flat string 'Title = product_id' (a nested object schema pushes Gemini's
 * forced-tool-call grammar past its state limit), or the same as an object. */
function parseOption(o: unknown): { title: string; product_id: string } {
  if (typeof o === 'string') {
    const at = o.lastIndexOf('=');
    return at < 0 ? { title: o.trim(), product_id: '' } : { title: o.slice(0, at).trim(), product_id: o.slice(at + 1).trim() };
  }
  const opt = (typeof o === 'object' && o !== null ? o : {}) as Json;
  return { title: str(opt.title), product_id: str(opt.product_id) };
}

/** Validates a `rotate` cycle: 2…MAX_OPTIONS options in week order, each with a title and a real (or no) listing, no listing
 * twice. `current` as product_id keeps whatever the step has this week. Returns the options as stored on a step, or null. */
function checkOptions(raw: unknown, target: RoutineStepContext, ctx: ToolContext, index: SearchIndex, problems: string[]): Json[] | null {
  if (!Array.isArray(raw) || !raw.length) return null;
  if (raw.length < 2) { problems.push(`a rotation needs at least 2 options (got ${raw.length}) — one per week, in order`); return null; }
  if (raw.length > MAX_OPTIONS) { problems.push(`a rotation holds at most ${MAX_OPTIONS} options (got ${raw.length})`); return null; }
  const out: Json[] = [];
  const seen = new Set<string>();
  raw.forEach((o, i) => {
    const opt = parseOption(o);
    const pid = opt.product_id;
    let product: Json | null = null;
    let category: string | null = target.category;
    let title = opt.title;
    let note = '';
    if (!pid) problems.push(`option ${i + 1}: write it as 'Title = product_id' ('current' keeps this week's product, 'none' = no product)`);
    if (pid.toLowerCase() === 'current') {
      note = target.note;
      if (!target.product) problems.push(`option ${i + 1}: the step has no product this week to keep as 'current'`);
      else { const hit = index.get(target.product.id, target.category); if (hit) { product = pinned(ctx, hit); category = hit.category; } else problems.push(`option ${i + 1}: this week's listing is no longer in the dataset`); }
    } else if (pid && pid.toLowerCase() !== 'none') {
      const hit = index.get(pid, target.category);
      if (!hit) problems.push(`option ${i + 1}: no listing with id '${pid}' in the dataset — use an id returned by a tool`);
      else { product = pinned(ctx, hit); category = hit.category; title ||= ctx.store.categoryMeta(hit.category)?.label ?? ''; }
    }
    if (product && seen.has(String(product.id))) problems.push(`option ${i + 1}: listing '${product.id}' is already another option — each week needs a different product`);
    if (product) seen.add(String(product.id));
    if (!title) problems.push(`option ${i + 1}: needs a short title (e.g. 'Retinol')`);
    out.push({ title, category, product, note });
  });
  return problems.length ? null : out;
}

/** How many steps the target's slot will hold after the edit — the step itself counts once, wherever it ends up. */
const slotSize = (steps: RoutineStepContext[], target: RoutineStepContext, slot: string) =>
  steps.filter((s) => s.slot === slot && s.id !== target.id).length + 1;

/** Parses `position`; pushes to `problems` when it is not a whole number inside the slot. A position equal to the current one
 * is kept when other edits ride along (re-sequencing a whole slot needs every step pinned), and only refused on its own. */
function checkPosition(raw: unknown, steps: RoutineStepContext[], target: RoutineStepContext, slot: string, alone: boolean, problems: string[]): number | null {
  const n = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() ? Number(raw) : NaN;
  if (!Number.isInteger(n) || n < 1) { problems.push(`position must be a whole number from 1 (got '${String(raw)}')`); return null; }
  const size = slotSize(steps, target, slot);
  if (n > size) { problems.push(`position ${n} is past the end — the ${slot.toUpperCase()} slot will have ${size} step${size === 1 ? '' : 's'}`); return null; }
  if (alone && slot === target.slot && n === target.position) { problems.push(`this step is already #${n} in the ${slot.toUpperCase()} slot`); return null; }
  return n;
}

export const editRoutineSteps: Tool = {
  name: EDIT_TOOL,
  surface: true,
  description:
    "Change steps that are ALREADY in the user's saved routine (listed in the page context with their step ids). Use it when "
    + 'the user asks to swap a product, move a step to other days, the other slot or another zone (face / body / scalp / lengths / beard / oral / other — the routine page groups these as Face · Body · Hair · Teeth · Other tabs), change the order steps are applied in, rename it, change its note, remove it, '
    + 'rotate products on it week by week, or note that they have / do not have a product. '
    + "op 'replace' needs product_id (a listing id from get_top_products / search_products in this conversation — never "
    + "invented) or the word 'none' to unpin the listing and keep the step; 'move' needs days and/or slot and/or zone (moving to oral / other, which have no ranked pages, needs product_id 'none' alongside when a listing is pinned); 'reorder' needs "
    + "position — the 1-based place within the step's AM or PM slot (the context shows each step's current #position; usual "
    + "order is cleanse → exfoliant → toner → essence → serums → eye → moisturiser → oil → sunscreen last in the morning); 'update' takes any "
    + "of title, note, days, slot, zone, position, product_id; 'remove' deletes the step and needs nothing else. To re-sequence a whole "
    + 'slot, send one reorder per step in ascending position order (1, 2, 3…). '
    + `'rotate' sets a WEEKLY cycle on one step (one option per calendar week, Mon–Sun, then back to option 1): options = the whole cycle in week order, 2 to ${MAX_OPTIONS} strings, each 'Title = product_id' ('current' = the product the step has this week, 'none' = no product, e.g. 'Azelaic acid = current', 'Retinol = minimalist-itm…'); active = which option (1-based) is on THIS week (default 1). `
    + "To only change which option is on this week of an existing rotation, send 'rotate' with just active. 'stop_rotation' ends the cycle and keeps one option as the step (active = which, default 1). "
    + "'owned' needs have: true when the user has the step's pinned product with them, false when they do not (ran out, not bought yet) — a shelf note, the step stays. "
    + 'Every change is shown to the '
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
            zone: { type: 'string', nullable: true, enum: ZONES, description: "Where the step goes: face, body, scalp, lengths, beard, oral (teeth & mouth), other (for 'move' / 'update')" },
            position: { type: 'integer', nullable: true, description: "1-based place within the slot the step ends up in — 1 goes on first, the slot's step count goes on last (for 'reorder' / 'move' / 'update')" },
            title: { type: 'string', nullable: true, description: "New short step name (for 'update')" },
            note: { type: 'string', nullable: true, description: "New note shown under the step (for 'update')" },
            options: {
              type: 'array', nullable: true,
              description: `The whole weekly cycle in week order, 2–${MAX_OPTIONS} strings 'Title = product_id' — listing id from a tool result, 'current' for this week's product, or 'none' (for 'rotate'; omit to keep the cycle and only change active)`,
              items: { type: 'string' },
            },
            active: { type: 'integer', nullable: true, description: "1-based option that is on this week (for 'rotate'), or the option to keep as the step (for 'stop_rotation')" },
            have: { type: 'boolean', nullable: true, description: "For 'owned': true = the user has this step's product with them, false = they do not" },
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
    const ownedSeen = new Set<string>();
    for (const entry of raw) {
      const e = (typeof entry === 'object' && entry !== null ? entry : {}) as Json;
      const stepId = str(e.step_id);
      const op = str(e.op);
      const target = steps.find((s) => s.id === stepId);
      const problems: string[] = [];
      if (!target) problems.push(`no step with id '${stepId}' in the routine — the steps are: ${steps.map(stepLine).join('; ')}`);
      if (!OPS.includes(op)) problems.push(`op must be one of ${OPS.join('/')} (got '${op}')`);
      const after: Json = {};
      if (target && op === 'owned') {
        if (typeof e.have !== 'boolean') problems.push("'owned' needs have: true or false");
        else if (!target.product) problems.push('this step has no product pinned, so there is nothing to mark on the shelf');
        else if (target.withMe === e.have) problems.push(`${target.product.brand} ${target.product.title} is already marked ${e.have ? 'with me' : 'not with me'}`);
        else if (ownedSeen.has(target.product.id)) problems.push('this product is already covered by another edit in this call');
        else { after.owned = e.have; ownedSeen.add(target.product.id); }
      } else if (target && (op === 'rotate' || op === 'stop_rotation')) {
        const total = target.rotation?.options.length ?? 1;
        if (op === 'stop_rotation') {
          if (!target.rotation) problems.push('this step does not rotate');
          else { const active = checkActive(e.active, total, problems); if (!problems.length) after.rotation = { active: active ?? 1 }; }
        } else if (Array.isArray(e.options) && e.options.length) {
          const options = checkOptions(e.options, target, ctx, index, problems);
          const active = checkActive(e.active, Array.isArray(e.options) ? e.options.length : 1, problems);
          if (options) after.rotation = { options, active: active ?? 1 };
        } else if (!target.rotation) {
          problems.push(`'rotate' needs options — the whole cycle in week order (2 to ${MAX_OPTIONS} options)`);
        } else {
          const active = checkActive(e.active, total, problems);
          if (active === null && !problems.length) problems.push("send options for a new cycle, or active to change which option is on this week");
          else if (active === target.rotation.active) problems.push(`option ${active} is already the one on this week`);
          else if (active !== null) after.rotation = { active };
        }
      } else if (target && OPS.includes(op) && op !== 'remove') {
        const productId = str(e.product_id);
        const daysRaw = str(e.days);
        const slot = str(e.slot);
        const zone = str(e.zone);
        const title = str(e.title);
        const note = typeof e.note === 'string' ? e.note.trim() : null;
        const hasPosition = e.position !== undefined && e.position !== null && e.position !== '';
        if (op === 'replace' && !productId) problems.push("'replace' needs product_id");
        if (op === 'move' && !daysRaw && !slot && !zone) problems.push("'move' needs days and/or slot and/or zone");
        if (op === 'reorder' && !hasPosition) problems.push("'reorder' needs position");
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
        if (zone) {
          const product = 'product' in after ? after.product : target.product;
          if (!ZONES.includes(zone)) problems.push(`zone must be one of ${ZONES.join('/')} (got '${zone}')`);
          else if (zone === target.zone) problems.push(`this step is already in the ${zone} zone`);
          else if (NO_PAGE_ZONES.includes(zone) && product) problems.push(`zone '${zone}' has no ranked pages on this site — send product_id 'none' in the same edit to unpin ${target.product?.brand ?? ''} ${target.product?.title ?? 'the listing'}, or keep the step where it is`);
          else if (NO_PAGE_ZONES.includes(zone) && target.rotation) problems.push(`zone '${zone}' has no ranked pages on this site — stop the rotation on this step first`);
          else { after.zone = zone; if (NO_PAGE_ZONES.includes(zone)) after.category = null; }
        }
        if (title) after.title = title;
        if (note !== null && note !== '') after.note = note;
        if (hasPosition) {
          const alone = raw.length === 1 && Object.keys(after).length === 0;
          const position = checkPosition(e.position, steps, target, typeof after.slot === 'string' ? after.slot : target.slot, alone, problems);
          if (position !== null) after.position = position;
        }
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
