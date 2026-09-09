import { TRIP } from '../data/trip.js';
import { eventsFor, LOCAL_KINDS } from '../events.js';
import { TZ, TZ_HOME, addDays, icsStamp, icsDate } from './dates.js';

// iCalendar export of the plan you are looking at — the same event list the
// calendar page shows: trip days, fixed legs, picks, meals, booking deadlines,
// dated documents and your own events. Times are Vietnam local (the Delhi
// departure in India time). Nothing here is a booking; document files are
// never included, only the fact that a record has a date.

const fold = (line) => {
  const out = [];
  let s = line;
  while (s.length > 72) { out.push(s.slice(0, 72)); s = ` ${s.slice(72)}`; }
  out.push(s);
  return out.join('\r\n');
};
const text = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const uid = (k) => `${k}@vietnam-planner`;

const when = (e) => {
  if (e.start == null) return [`DTSTART;VALUE=DATE:${icsDate(e.iso)}`, `DTEND;VALUE=DATE:${icsDate(addDays(e.iso, 1))}`];
  const tz = e.tz === 'in' ? TZ_HOME : TZ;
  return [`DTSTART;TZID=${tz}:${icsStamp(e.iso, e.start)}`, `DTEND;TZID=${tz}:${icsStamp(e.iso, Math.max(e.end ?? e.start + 60, e.start + 15))}`];
};

export const eventTitle = (e) => (e.kind === 'deadline' ? `Book by: ${e.title}` : e.title);

const vevent = (e) => [
  'BEGIN:VEVENT',
  ...[
    `UID:${uid(e.id)}`,
    ...when(e),
    `SUMMARY:${text(eventTitle(e))}`,
    ...(e.sub ? [`DESCRIPTION:${text(e.sub)}`] : []),
    ...(e.where ? [`LOCATION:${text(e.where)}`] : []),
  ].map(fold),
  'END:VEVENT',
];

// Ticked-off deadlines stay out of the file (they are done), and so do the
// Split ledger's spend rows: money stays in the browser.
export const exportable = (events) => events.filter((e) => !LOCAL_KINDS.has(e.kind) && !(e.kind === 'deadline' && e.done));

export function buildICS(state, events = exportable(eventsFor(state))) {
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//vietnam planner//EN', 'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${text(TRIP.title)}`, `X-WR-TIMEZONE:${TZ}`,
    ...events.flatMap(vevent),
    'END:VCALENDAR', '',
  ].join('\r\n');
}

export const ICS_NAME = `vietnam-${TRIP.start}.ics`;
