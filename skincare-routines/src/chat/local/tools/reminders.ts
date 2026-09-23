/** `set_reminders`: the assistant's way to change the morning / night reminder time or switch — like `edit_routine_steps`,
 * it only returns validated before → after changes that land as pending cards; nothing is set until the user applies. */
import type { Manifest } from '../../../lib/types';
import { REMIND_TOOL } from '../../../schedule/reminders/proposals';
import { str, ToolError, type Json, type Tool, type ToolContext } from './base';

const SLOTS = ['am', 'pm'] as const;
type Slot = (typeof SLOTS)[number];
const SLOT_NAME: Record<Slot, string> = { am: 'morning', pm: 'night' };
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const isSlot = (v: unknown): v is Slot => v === 'am' || v === 'pm';

/** Accepts "22:00", "22.00", "2200", "10 pm", "10:30pm", "7am" → "HH:MM"; null when it cannot be read. */
export function parseTime(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, '');
  const m = /^(\d{1,2})(?:[:.h]?(\d{2}))?(am|pm)?$/.exec(s);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const ampm = m[3];
  if (ampm) {
    if (h < 1 || h > 12) return null;
    if (ampm === 'am' && h === 12) h = 0;
    if (ampm === 'pm' && h !== 12) h += 12;
  }
  const out = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  return TIME.test(out) ? out : null;
}

export const setReminders: Tool = {
  name: REMIND_TOOL,
  surface: true,
  description:
    "Change the user's morning (am) or night (pm) routine reminder on this device: the time it fires and/or whether it is on. "
    + 'The page context lists the current state of both ("reminders: morning off 07:30 · night on 21:30"). Use it when the user '
    + 'asks to be reminded at a time, to move a reminder, or to turn one on or off. time is 24-hour HH:MM (10 pm = 22:00). '
    + 'Each change is shown to the user as a before/after card they apply or reject — this call changes nothing by itself. '
    + 'Notification permission and the push registration are handled in the app, not here.',
  parameters: (_manifest: Manifest) => ({
    type: 'object',
    properties: {
      changes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            slot: { type: 'string', enum: [...SLOTS], description: 'am = morning reminder, pm = night reminder' },
            time: { type: 'string', nullable: true, description: 'New time, 24-hour HH:MM (e.g. 22:00)' },
            enabled: { type: 'boolean', nullable: true, description: 'true to turn the reminder on, false to turn it off' },
            why: { type: 'string', description: 'One short sentence: what the user asked for' },
          },
          required: ['slot', 'why'],
        },
      },
    },
    required: ['changes'],
  }),
  async run(args: Json, ctx: ToolContext): Promise<Json> {
    const raw = Array.isArray(args.changes) ? args.changes : [];
    if (!raw.length) throw new ToolError('changes must be a non-empty array');
    const current = ctx.page.routineReminders;
    if (!current) throw new ToolError('Reminder settings are not available on this page — ask the user to open My routine → Remind.');
    const changes: Json[] = [];
    const problems: string[] = [];
    const seen = new Set<Slot>();
    raw.slice(0, 2).forEach((c, i) => {
      const change = (typeof c === 'object' && c !== null ? c : {}) as Json;
      const slot = change.slot;
      if (!isSlot(slot)) { problems.push(`change ${i + 1}: slot must be am or pm`); return; }
      if (seen.has(slot)) { problems.push(`change ${i + 1}: the ${SLOT_NAME[slot]} reminder is already changed in this call`); return; }
      const before = current[slot];
      let time = before.time;
      const t = str(change.time);
      if (t) {
        const parsed = parseTime(t);
        if (!parsed) { problems.push(`change ${i + 1}: time '${t}' is not HH:MM (24-hour)`); return; }
        time = parsed;
      }
      const enabled = typeof change.enabled === 'boolean' ? change.enabled : before.enabled;
      if (!t && typeof change.enabled !== 'boolean') { problems.push(`change ${i + 1}: needs a time and/or enabled`); return; }
      if (time === before.time && enabled === before.enabled) {
        problems.push(`change ${i + 1}: the ${SLOT_NAME[slot]} reminder is already ${enabled ? 'on' : 'off'} at ${time}`);
        return;
      }
      seen.add(slot);
      changes.push({ slot, before: { enabled: before.enabled, time: before.time }, after: { enabled, time }, enabled, time, why: str(change.why) });
    });
    return {
      changes,
      problems,
      note: changes.length
        ? `${changes.length} reminder change${changes.length === 1 ? '' : 's'} shown to the user as before/after cards to apply or reject — not applied yet. Tell the user to review them in My routine.`
        : 'No valid change — read `problems`.',
    };
  },
};
