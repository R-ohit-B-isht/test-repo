/** Phone-clock fallback: a small iCalendar file with one recurring alarmed event per enabled slot. The phone's own
 * calendar rings at the time — no server, no permission prompt, no dependence on this site staying up. */
import { DAYS, SLOT_LABEL, SLOTS, stepsFor, type Day, type Slot, type Step } from '../model';
import type { ReminderSettings } from './store';

const BYDAY: Record<Day, string> = { mon: 'MO', tue: 'TU', wed: 'WE', thu: 'TH', fri: 'FR', sat: 'SA', sun: 'SU' };
const pad = (n: number) => String(n).padStart(2, '0');

/** Backslash-escape per RFC 5545 §3.3.11 and strip line breaks. */
export const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, ' ');

/** Fold long content lines at 75 octets (RFC 5545 §3.1); ASCII-safe approximation by characters. */
export function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 73) { out.push(rest.slice(0, 73)); rest = ` ${rest.slice(73)}`; }
  out.push(rest);
  return out.join('\r\n');
}

/** Days on which a slot has at least one step, in Mon–Sun order. */
export const daysWithSteps = (steps: Step[], slot: Slot): Day[] => DAYS.filter((d) => stepsFor(steps, slot, d).length > 0);

const stamp = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
const localDate = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

export interface IcsEvent { slot: Slot; time: string; days: Day[]; summary: string; description: string }

export function eventsFor(steps: Step[], settings: ReminderSettings): IcsEvent[] {
  return SLOTS.filter((slot) => settings.slots[slot].enabled).map((slot) => {
    const routineDays = daysWithSteps(steps, slot);
    const days = settings.onlyRoutineDays && routineDays.length ? routineDays : [...DAYS];
    const titles = Array.from(new Set(DAYS.flatMap((d) => stepsFor(steps, slot, d).map((s) => s.title.trim())).filter(Boolean)));
    const description = titles.length ? `Steps this week: ${titles.join(' · ')}. Open the routine for today’s exact list.` : 'Open the routine for today’s steps.';
    return { slot, time: settings.slots[slot].time, days, summary: `${SLOT_LABEL[slot]} skincare routine`, description };
  });
}

/** Floating local times (no TZID) so the alarm follows the phone's clock when travelling, like an alarm-clock entry. */
export function buildIcs(steps: Step[], settings: ReminderSettings, now = new Date(), tz?: string): string {
  const events = eventsFor(steps, settings);
  const start = localDate(now);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Skin Ledger//Routine reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Skincare routine'];
  if (tz) lines.push(`X-WR-TIMEZONE:${icsText(tz)}`);
  for (const ev of events) {
    const [hh, mm] = ev.time.split(':');
    lines.push(
      'BEGIN:VEVENT',
      `UID:skin-ledger-routine-${ev.slot}@local`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${start}T${hh}${mm}00`,
      'DURATION:PT15M',
      `RRULE:FREQ=WEEKLY;BYDAY=${ev.days.map((d) => BYDAY[d]).join(',')}`,
      `SUMMARY:${icsText(ev.summary)}`,
      `DESCRIPTION:${icsText(ev.description)}`,
      'TRANSP:TRANSPARENT',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${icsText(ev.summary)}`,
      'TRIGGER:PT0S',
      'END:VALARM',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

export function downloadIcs(text: string, filename = 'skincare-routine-reminders.ics') {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
