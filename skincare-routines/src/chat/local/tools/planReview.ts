/** Second-opinion tool for the routine planner: the page has already built the week deterministically and picked a
 * listing per step from the rankings; Gemini is asked to read that plan, write one honest line per step and flag anything
 * a dermatologist would question. It may swap a pick, but only to another id from the candidates it was shown — every id is
 * checked against the dataset here, and the planner re-checks it against the candidate list before using it.
 * Twin of chat_api/tools/plan_review.py. */
import type { Manifest } from '../../../lib/types';
import { str, ToolError, type Json, type Tool } from './base';

export const REVIEW_TOOL = 'review_routine_plan';
const MAX_NOTES = 40;
const MAX_WARNINGS = 12;

export const reviewRoutinePlan: Tool = {
  name: REVIEW_TOOL,
  surface: true,
  description:
    "Return your review of a weekly routine plan the user's 'My routine' page built (the plan and each step's candidate listings "
    + 'are in the message). For every step id give one plain sentence on why it sits where it does or what to watch; optionally '
    + 'swap the pick to another candidate id shown for that step (never an id from elsewhere). List any plan-level warnings — '
    + 'clashes, missing sunscreen, too many layers, ingredients that do not suit the stated skin type. Call it once, with all steps.',
  parameters: (_manifest: Manifest) => ({
    type: 'object',
    properties: {
      notes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            step: { type: 'string', description: "Step id exactly as given in the plan, e.g. 'retinol:pm'" },
            why: { type: 'string', description: 'One sentence, plain words, no marketing' },
            pick_id: { type: 'string', nullable: true, description: 'A candidate listing id shown for this step to use instead of the first one, or null to keep it' },
          },
          required: ['step', 'why'],
        },
      },
      warnings: { type: 'array', items: { type: 'string' }, description: 'Plan-level cautions in one sentence each; empty when none' },
    },
    required: ['notes', 'warnings'],
  }),
  async run(args, ctx) {
    const rawNotes = Array.isArray(args.notes) ? args.notes.slice(0, MAX_NOTES) : [];
    if (!rawNotes.length) throw new ToolError('notes must be a non-empty array — one entry per step id in the plan');
    const index = await ctx.store.search();
    const notes: Json[] = [];
    const problems: string[] = [];
    for (const entry of rawNotes) {
      const n = (typeof entry === 'object' && entry !== null ? entry : {}) as Json;
      const step = str(n.step);
      const why = str(n.why);
      if (!/^[a-z0-9]+:(am|pm)$/.test(step)) { problems.push(`'${step || '(blank)'}' is not a step id from the plan`); continue; }
      if (!why) { problems.push(`${step}: empty note`); continue; }
      const pickId = str(n.pick_id) || null;
      if (pickId && !index.get(pickId)) { problems.push(`${step}: no listing with id '${pickId}' in the dataset — pick kept`); }
      notes.push({ step, why, pickId: pickId && index.get(pickId) ? pickId : null });
    }
    const warnings = (Array.isArray(args.warnings) ? args.warnings : []).map((w) => str(w)).filter(Boolean).slice(0, MAX_WARNINGS);
    return {
      noted: notes.length, notes, warnings, problems,
      note: notes.length ? 'The review is now shown next to the plan on the My routine page. Reply with ONE short verdict sentence about the week itself (what is well spaced, the single thing to watch) — not a confirmation that notes were added.' : 'Nothing usable — every entry was rejected; fix the step ids and call again.',
    };
  },
};
