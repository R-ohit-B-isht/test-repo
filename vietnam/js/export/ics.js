import { TRIP, STOPS, isoOf } from '../data/trip.js';
import { DAYS, whereFor } from '../data/days.js';
import { PRICES } from '../data/prices.js';
import { findStrategy } from '../strategies.js';
import { planTrip } from '../plan.js';
import { timelineFor } from '../timeline.js';
import { TZ, TZ_HOME, addDays, icsStamp, icsDate, toMins } from './dates.js';

// iCalendar export of the plan you are looking at: one all-day event per trip
// day, plus timed events for every fixed leg, pick and meal from the same
// timeline the day board shows. Times are Vietnam local (Delhi departure in
// India time). Nothing here is a booking — it is your plan, in your calendar.

const fold = (line) => {
  const out = [];
  let s = line;
  while (s.length > 72) { out.push(s.slice(0, 72)); s = ` ${s.slice(72)}`; }
  out.push(s);
  return out.join('\r\n');
};
const text = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const uid = (k) => `${k}@vietnam-planner`;

const vevent = (fields) => ['BEGIN:VEVENT', ...fields.map(fold), 'END:VEVENT'];

const allDay = (day, transit) => {
  const stop = STOPS.find((s) => s.id === day.stop);
  const iso = isoOf(day.n);
  return vevent([
    `UID:${uid(`day${day.n}`)}`,
    `DTSTART;VALUE=DATE:${icsDate(iso)}`,
    `DTEND;VALUE=DATE:${icsDate(addDays(iso, 1))}`,
    `SUMMARY:${text(`Day ${day.n} · ${day.title} · ${whereFor(day, transit) || stop.name}`)}`,
    `DESCRIPTION:${text(day.tips.join(' · '))}`,
  ]);
};

const KEEP = new Set(['do', 'fixed', 'eat']);

const timed = (day, rows) => {
  const iso = isoOf(day.n);
  return rows.filter((r) => KEEP.has(r.kind) && !r.inside && !r.arrive).flatMap((r, i) => vevent([
    `UID:${uid(`d${day.n}-${i}-${r.kind}`)}`,
    `DTSTART;TZID=${TZ}:${icsStamp(iso, r.start)}`,
    `DTEND;TZID=${TZ}:${icsStamp(iso, Math.max(r.end, r.start + 15))}`,
    `SUMMARY:${text(r.label)}`,
    ...(r.x?.note || r.meal?.dish ? [`DESCRIPTION:${text(r.x?.note || r.meal.dish)}`] : []),
    ...(r.x?.stop ? [`LOCATION:${text(STOPS.find((s) => s.id === r.x.stop)?.name || r.x.stop)}`] : []),
  ]));
};

// The flight out of Delhi leaves the night before day 1 on open-jaw routes.
const flyOut = (state) => {
  const leg = findStrategy(state.strategy).legs(PRICES, state)[0];
  const f = leg.price;
  if (!f.iso || f.iso >= TRIP.start) return [];
  const dep = toMins(f.range.match(/dep (\d\d:\d\d)/)?.[1]) ?? 23 * 60;
  return vevent([
    `UID:${uid('flyout')}`,
    `DTSTART;TZID=${TZ_HOME}:${icsStamp(f.iso, dep)}`,
    `DTEND;TZID=${TZ_HOME}:${icsStamp(f.iso, dep + 60)}`,
    `SUMMARY:${text(`Fly ${leg.from} → ${leg.to} · ${f.carrier}`)}`,
    `DESCRIPTION:${text(`${f.range}. ${TRIP.observedWindow}. A fare seen, not a booking.`)}`,
    `LOCATION:${text(TRIP.origin)}`,
  ]);
};

export function buildICS(state) {
  const transit = findStrategy(state.strategy).transit;
  const plan = planTrip(state, transit);
  const body = DAYS.flatMap((day) => [
    ...allDay(day, transit),
    ...timed(day, timelineFor(day, plan.days[day.n - 1], transit).rows),
  ]);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//vietnam planner//EN', 'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${text(TRIP.title)}`, `X-WR-TIMEZONE:${TZ}`,
    ...flyOut(state), ...body,
    'END:VCALENDAR', '',
  ].join('\r\n');
}

export const ICS_NAME = `vietnam-${TRIP.start}.ics`;
