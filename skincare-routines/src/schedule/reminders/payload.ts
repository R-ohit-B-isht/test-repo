/** What one device tells the reminder service: subscription, time zone, the two times, and the step names for each
 * day of this week and next — resolved through the same weekly rotation the schedule views use, so the push for a
 * rotating step names the product that is actually on that week. Step names only: no product evidence, no notes. */
import { DAYS, SLOTS, stepsFor, type Day, type Slot, type Step } from '../model';
import { shiftWeek, viewForWeek, weekMonday } from '../rotation';
import type { ReminderSettings } from './store';

export interface DaySteps { am: string[]; pm: string[] }
export interface WeekSteps { monday: string; days: Partial<Record<Day, DaySteps>> }
export interface PushSubscriptionJson { endpoint: string; keys: { p256dh: string; auth: string }; expirationTime: number | null }
export interface ReminderRecord {
  subscription: PushSubscriptionJson;
  tz: string;
  slots: Record<Slot, { enabled: boolean; time: string }>;
  onlyRoutineDays: boolean;
  weeks: WeekSteps[];
  url: string;
}

export const WEEKS_AHEAD = 2;
export const ROUTINE_URL = '/#/routine';

/** Step names for a slot on a given day of the week starting `monday`, in application order. */
export function titlesFor(steps: Step[], monday: string, day: Day, slot: Slot): string[] {
  return stepsFor(steps, slot, day).map((s) => viewForWeek(s, monday).now.title.trim()).filter(Boolean);
}

export function weekSteps(steps: Step[], monday: string): WeekSteps {
  const days: Partial<Record<Day, DaySteps>> = {};
  for (const day of DAYS) {
    const am = titlesFor(steps, monday, day, 'am');
    const pm = titlesFor(steps, monday, day, 'pm');
    if (am.length || pm.length) days[day] = { am, pm };
  }
  return { monday, days };
}

export function deviceTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}

export function reminderRecord(steps: Step[], settings: ReminderSettings, subscription: PushSubscriptionJson, now = new Date(), tz = deviceTimeZone()): ReminderRecord {
  const monday = weekMonday(now);
  return {
    subscription,
    tz,
    slots: Object.fromEntries(SLOTS.map((s) => [s, { enabled: settings.slots[s].enabled, time: settings.slots[s].time }])) as ReminderRecord['slots'],
    onlyRoutineDays: settings.onlyRoutineDays,
    weeks: Array.from({ length: WEEKS_AHEAD }, (_, i) => weekSteps(steps, shiftWeek(monday, i))),
    url: ROUTINE_URL,
  };
}

/** Small stable fingerprint of a record (djb2 over its JSON) — enough to skip re-sending an unchanged routine. */
export function recordHash(record: ReminderRecord): string {
  const text = JSON.stringify(record);
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return `${h.toString(16)}-${text.length}`;
}
