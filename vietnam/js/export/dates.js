import { TRIP } from '../data/trip.js';

// Date helpers shared by the calendar page, the ICS export and the checklist.
// All trip dates are Vietnam local time (UTC+7); India is UTC+5:30.
export const TZ = 'Asia/Ho_Chi_Minh';
export const TZ_HOME = 'Asia/Kolkata';

const pad = (x) => String(x).padStart(2, '0');

export const parseISO = (iso) => new Date(`${iso}T00:00:00`);
export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };

// Trip day number for an ISO date (day 0 = the night you fly out), or null.
export const dayOf = (iso) => {
  const n = Math.round((parseISO(iso) - parseISO(TRIP.start)) / 864e5) + 1;
  return n >= 0 && n <= TRIP.days ? n : null;
};

export const fmtDate = (iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) => parseISO(iso).toLocaleDateString('en-IN', opts);

// Minutes since midnight ↔ "HH:MM"; minutes may run past 24 h for overnight rows.
export const toMins = (hhmm) => { if (!hhmm) return null; const [h, m] = hhmm.split(':').map(Number); return h * 60 + (m || 0); };
export const toClock = (mins) => `${pad(Math.floor((mins % 1440) / 60))}:${pad(mins % 60)}`;

// ICS local-time stamp for a date plus minutes (spills into the next day).
export const icsStamp = (iso, mins) => {
  const d = parseISO(iso);
  d.setMinutes(mins);
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
};
export const icsDate = (iso) => iso.replace(/-/g, '');
