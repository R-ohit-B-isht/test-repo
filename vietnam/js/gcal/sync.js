import { GCAL_CLIENT_SLOT, GCAL_MAP_SLOT, GCAL_NAME } from '../config.js';
import { gcalBody } from '../export/gcal.js';

// Optional two-way Google Calendar sync, bring-your-own OAuth client id (like
// the Gemini key). Everything runs in the browser: Google Identity Services
// hands us a short-lived access token that lives in memory only; the client id
// and the map "our event id → Google event id" sit in their own localStorage
// slots, never in planner state or the share URL. The app only ever touches
// the one calendar it creates, named GCAL_NAME.

const GIS = 'https://accounts.google.com/gsi/client';
const API = 'https://www.googleapis.com/calendar/v3';
const SCOPE = 'https://www.googleapis.com/auth/calendar';

let token = null;
let tokenClient = null;

export const getClientId = () => localStorage.getItem(GCAL_CLIENT_SLOT) || '';
export const setClientId = (id) => (id ? localStorage.setItem(GCAL_CLIENT_SLOT, id.trim()) : localStorage.removeItem(GCAL_CLIENT_SLOT));
export const isConnected = () => !!token;

const readMap = () => { try { return JSON.parse(localStorage.getItem(GCAL_MAP_SLOT) || '{}'); } catch { return {}; } };
const writeMap = (m) => localStorage.setItem(GCAL_MAP_SLOT, JSON.stringify(m));
export const syncedCount = () => Object.keys(readMap().ids || {}).length;
export const forget = () => { token = null; localStorage.removeItem(GCAL_MAP_SLOT); };

const loadGis = () => new Promise((ok, err) => {
  if (globalThis.google?.accounts?.oauth2) return ok();
  const s = document.createElement('script');
  s.src = GIS; s.async = true; s.onload = ok; s.onerror = () => err(new Error('Could not load Google sign-in. Online?'));
  document.head.appendChild(s);
});

export async function connect() {
  const clientId = getClientId();
  if (!clientId) throw new Error('Paste an OAuth client id first.');
  await loadGis();
  return new Promise((ok, err) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId, scope: SCOPE,
      callback: (r) => { if (r.error) return err(new Error(r.error_description || r.error)); token = r.access_token; ok(); },
      error_callback: (e) => err(new Error(e.message || e.type || 'Sign-in was cancelled.')),
    });
    tokenClient.requestAccessToken({ prompt: '' });
  });
}

const call = async (method, path, body) => {
  if (!token) throw new Error('Not connected to Google.');
  const r = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (r.status === 401) { token = null; throw new Error('Google session expired. Connect again.'); }
  if (r.status === 404) return null;
  if (!r.ok) throw new Error((await r.json().catch(() => null))?.error?.message || `Google said ${r.status}`);
  return r.status === 204 ? {} : r.json();
};

// Find or create the trip calendar; remembered so it is one call next time.
async function calendarId() {
  const map = readMap();
  if (map.cal && await call('GET', `/calendars/${enc(map.cal)}`)) return map.cal;
  const list = await call('GET', '/users/me/calendarList?minAccessRole=owner&maxResults=250');
  const found = list?.items?.find((c) => c.summary === GCAL_NAME);
  const cal = found || await call('POST', '/calendars', { summary: GCAL_NAME, timeZone: 'Asia/Ho_Chi_Minh' });
  writeMap({ ...map, cal: cal.id });
  return cal.id;
}
const enc = encodeURIComponent;

// Push: insert new, patch known, delete what you removed. `report(done, total)`
// keeps the button honest while ~60 requests run.
export async function push(events, removedIds, report = () => {}) {
  const cal = await calendarId();
  const map = readMap();
  const ids = { ...(map.ids || {}) };
  const total = events.length + removedIds.length;
  let n = 0;
  for (const e of events) {
    const body = gcalBody(e);
    const patched = ids[e.id] ? await call('PATCH', `/calendars/${enc(cal)}/events/${enc(ids[e.id])}`, body) : null;
    if (!patched) ids[e.id] = (await call('POST', `/calendars/${enc(cal)}/events`, body)).id;
    report(++n, total);
  }
  for (const id of removedIds) {
    if (ids[id]) { await call('DELETE', `/calendars/${enc(cal)}/events/${enc(ids[id])}`); delete ids[id]; }
    report(++n, total);
  }
  writeMap({ cal, ids });
  return { pushed: events.length, removed: removedIds.length };
}

const mins = (dt) => { const t = dt.slice(11, 16).split(':').map(Number); return t[0] * 60 + t[1]; };
const fromGoogle = (g) => ({
  id: `g-${g.id}`, title: g.summary || '(no title)', iso: (g.start.date || g.start.dateTime).slice(0, 10),
  start: g.start.dateTime ? mins(g.start.dateTime) : null, end: g.end?.dateTime ? mins(g.end.dateTime) : null,
  note: g.description || '', where: g.location || '', gcal: g.id,
});

// Pull: events someone added to the trip calendar in Google (not pushed by us,
// not already pulled) come back as your own events.
export async function pull(knownGoogleIds) {
  const cal = await calendarId();
  const known = new Set([...knownGoogleIds, ...Object.values(readMap().ids || {})]);
  const r = await call('GET', `/calendars/${enc(cal)}/events?singleEvents=true&maxResults=250&orderBy=startTime`);
  return (r?.items || []).filter((g) => g.status !== 'cancelled' && !known.has(g.id) && !g.extendedProperties?.private?.vietnamPlanner).map(fromGoogle);
}
