/** `read_routine`: the user's saved routine as structured data — every step with this week's product, shelf state ("with me"),
 *  the whole weekly rotation (all options, this week's and next week's), and the reminder settings. Read-only; the same
 *  facts the page context summarises, laid out so the model can answer "what don't I have" / "what's next week" exactly.
 *  Twin of chat_api/tools/routine_read.py. */
import type { RoutineStepContext } from '../../types';
import { ToolError, type Json, type Tool } from './base';

export const READ_TOOL = 'read_routine';

const SLOTS = ['am', 'pm'] as const;

function stepJson(s: RoutineStepContext): Json {
  const rotation = s.rotation
    ? {
      active: s.rotation.active,
      next_week: (s.rotation.active % s.rotation.options.length) + 1,
      options: s.rotation.options.map((o, i) => ({ option: i + 1, title: o.title, product: o.product })),
    }
    : null;
  return {
    id: s.id, slot: s.slot, position: s.position, days: s.days, zone: s.zone, title: s.title, category: s.category,
    product: s.product, with_me: s.withMe, note: s.note || null, rotation,
  };
}

export const readRoutine: Tool = {
  name: READ_TOOL,
  description: 'Read the user\'s saved routine on this device: every step (id, AM/PM, days, zone, product), which products are '
    + 'marked "not with me" on the shelf, each weekly rotation with all its options and this week\'s / next week\'s one, and the '
    + 'morning / night reminder settings. Read-only. Use it to answer questions about the routine, shelf, rotations or reminders '
    + 'and before proposing changes to them; it changes nothing.',
  parameters: () => ({
    type: 'object',
    properties: { slot: { type: 'string', nullable: true, description: 'am or pm to read one slot; omit for the whole routine' } },
  }),
  async run(args, ctx) {
    const steps = ctx.page?.routineSteps;
    if (!steps) throw new ToolError('The saved routine is not available on this page — ask the user to open My routine.');
    const slot = typeof args.slot === 'string' && args.slot.trim() ? args.slot.trim().toLowerCase() : null;
    if (slot && !(SLOTS as readonly string[]).includes(slot)) throw new ToolError(`slot must be am or pm, not '${slot}'`);
    const shown = slot ? steps.filter((s) => s.slot === slot) : steps;
    const notWithMe = shown.filter((s) => s.withMe === false && s.product)
      .map((s) => ({ step_id: s.id, title: s.title, product: s.product }));
    const reminders = ctx.page?.routineReminders ?? null;
    return {
      steps: shown.length, list: shown.map(stepJson),
      not_with_me: notWithMe,
      rotating: shown.filter((s) => s.rotation).map((s) => s.id),
      reminders: reminders ? { am: { ...reminders.am }, pm: { ...reminders.pm } } : null,
      note: `${shown.length} step${shown.length === 1 ? '' : 's'}${slot ? ` in ${slot.toUpperCase()}` : ''}; `
        + `${notWithMe.length} not with the user; a rotating step uses exactly one option per Mon–Sun week (rotation.active), never several together. `
        + 'Change steps/shelf/rotations with edit_routine_steps and reminders with set_reminders — both only propose.',
    };
  },
};
