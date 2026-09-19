/** Routine-builder tool: Gemini proposes AM/PM steps for the user's plan; every product reference is validated against
 * the search index here, so a proposal can only ever point at a listing that exists (twin of chat_api/tools/routine.py).
 * The result is also surfaced to the UI as a `tool_payload` event — the steps land as PENDING proposals, never as accepted ones. */
import type { Manifest } from '../../../lib/types';
import { productUrl, str, strList, ToolError, type Json, type Tool } from './base';

const SLOTS = ['am', 'pm'];
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const ZONES = ['face', 'body', 'scalp', 'lengths', 'beard'];
const MAX_STEPS = 16;

/** Days arrive as 'mon,wed,fri', 'daily' or a list (a plain string keeps the tool schema small enough for Gemini); unknown tokens are dropped. */
export function parseDays(v: unknown): string[] {
  const parts = Array.isArray(v) ? strList(v) : str(v).toLowerCase().split(/[\s,/;]+/);
  if (parts.some((p) => p === 'daily' || p === 'everyday' || p === 'all')) return [...DAYS];
  return DAYS.filter((d) => parts.some((p) => p.slice(0, 3) === d));
}

export const PROPOSE_TOOL = 'propose_routine_steps';

export const proposeRoutineSteps: Tool = {
  name: PROPOSE_TOOL,
  surface: true,
  description:
    "Propose steps for the user's weekly AM/PM routine ('My routine' page). Each step names the action (e.g. 'Cleanse', "
    + "'Vitamin C serum', 'Sunscreen'), the slot, the days it applies to, the zone, the site category and optionally ONE "
    + 'listing id taken from get_top_products / search_products results in this conversation. Every product id is checked '
    + 'against the dataset: unknown ids are rejected and reported back. Proposals are shown to the user as pending '
    + 'suggestions they accept, edit or reject — nothing is added to their routine by this call. Call it once with the full '
    + 'set of steps rather than once per step.',
  parameters: (manifest: Manifest) => ({
    type: 'object',
    properties: {
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: "Short step name, e.g. 'Cleanse', 'Retinol', 'Moisturise', 'Scalp serum'" },
            slot: { type: 'string', enum: SLOTS, description: 'am = morning, pm = night' },
            days: { type: 'string', description: "Comma-separated weekdays this step applies to, from mon,tue,wed,thu,fri,sat,sun — or 'daily' for every day; e.g. 'mon,wed,fri' for alternate-night actives" },
            zone: { type: 'string', enum: ZONES },
            category: { type: 'string', description: `Site category id exactly as returned by list_categories / get_top_products (one of: ${manifest.categories.map((c) => c.id).join(', ')})` },
            product_id: { type: 'string', nullable: true, description: 'Listing id from a tool result in this conversation, or null when the user should pick a product later' },
            why: { type: 'string', description: 'One sentence: why this step / this pick, plain words, no marketing' },
          },
          required: ['title', 'slot', 'days', 'zone', 'category', 'why'],
        },
      },
    },
    required: ['steps'],
  }),
  async run(args, ctx) {
    const raw = Array.isArray(args.steps) ? args.steps.slice(0, MAX_STEPS) : [];
    if (!raw.length) throw new ToolError('steps must be a non-empty array');
    const manifest = await ctx.store.manifest();
    const index = await ctx.store.search();
    const accepted: Json[] = [];
    const rejected: Json[] = [];
    for (const entry of raw) {
      const s = (typeof entry === 'object' && entry !== null ? entry : {}) as Json;
      const title = str(s.title);
      const slot = str(s.slot);
      const zone = str(s.zone);
      const category = str(s.category) || null;
      const days = parseDays(s.days);
      const problems: string[] = [];
      if (!title) problems.push('missing title');
      if (!SLOTS.includes(slot)) problems.push(`slot must be am or pm (got '${slot}')`);
      if (!ZONES.includes(zone)) problems.push(`zone must be one of ${ZONES.join('/')} (got '${zone}')`);
      if (!days.length) problems.push('days is empty');
      if (category && !manifest.categories.some((c) => c.id === category)) problems.push(`unknown category '${category}'`);
      const productId = str(s.product_id) || null;
      let product: Json | null = null;
      if (productId && !problems.length) {
        const hit = index.get(productId, category);
        if (!hit) problems.push(`no listing with id '${productId}' in the dataset — use an id returned by a tool, or leave product_id null`);
        else if (category && hit.category !== category) problems.push(`listing '${productId}' is ranked in ${hit.category}, not ${category}`);
        else {
          product = {
            id: hit.id, category: hit.category, brand: hit.brand, title: hit.title, rank: hit.rank, of: ctx.store.categoryMeta(hit.category)?.count ?? null,
            score: hit.score, priceInr: hit.price, store: hit.store, inciStatus: hit.inci, inciSourceKind: hit.inciSource, url: productUrl(ctx, hit.category, hit.id),
          };
        }
      }
      if (problems.length) rejected.push({ title: title || '(untitled)', reasons: problems });
      else accepted.push({ title, slot, days: DAYS.filter((d) => days.includes(d)), zone, category, product, why: str(s.why) });
    }
    return {
      proposed: accepted.length, rejected: rejected.length, steps: accepted, problems: rejected,
      note: accepted.length
        ? 'These steps are now shown to the user as pending suggestions on the My routine page; they decide what to accept. Summarise the plan briefly in your answer and mention anything you could not fill.'
        : 'Nothing could be proposed — fix the problems and call again, or explain to the user what is missing.',
    };
  },
};
