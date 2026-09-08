import { TZ, TZ_HOME, addDays, icsStamp, icsDate } from './dates.js';
import { eventTitle } from './ics.js';

// Google Calendar "add this event" links: no login, no API — the URL carries
// the event and Google shows its own save screen. Adapter: our event → their
// query string. The whole-trip route is the .ics file (import once), or the
// signed-in sync in gcal/sync.js.

const RENDER = 'https://calendar.google.com/calendar/render';
export const GCAL_IMPORT = 'https://calendar.google.com/calendar/u/0/r/settings/export';

const dates = (e) => {
  if (e.start == null) return `${icsDate(e.iso)}/${icsDate(addDays(e.iso, 1))}`;
  return `${icsStamp(e.iso, e.start)}/${icsStamp(e.iso, Math.max(e.end ?? e.start + 60, e.start + 15))}`;
};

export const gcalLink = (e) => {
  const q = new URLSearchParams({ action: 'TEMPLATE', text: eventTitle(e), dates: dates(e), ctz: e.tz === 'in' ? TZ_HOME : TZ });
  if (e.sub) q.set('details', e.sub);
  if (e.where) q.set('location', e.where);
  return `${RENDER}?${q}`;
};

// Body for the Calendar API (insert / patch), same fields as the link.
export const gcalBody = (e) => {
  const tz = e.tz === 'in' ? TZ_HOME : TZ;
  const time = e.start == null
    ? { start: { date: e.iso }, end: { date: addDays(e.iso, 1) } }
    : { start: { dateTime: stamp(e.iso, e.start), timeZone: tz }, end: { dateTime: stamp(e.iso, Math.max(e.end ?? e.start + 60, e.start + 15)), timeZone: tz } };
  return { summary: eventTitle(e), description: e.sub || undefined, location: e.where || undefined, ...time, extendedProperties: { private: { vietnamPlanner: e.id } } };
};

const stamp = (iso, mins) => { const s = icsStamp(iso, mins); return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:00`; };
