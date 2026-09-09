import { DEFAULT_STATE, SHAREABLE } from './config.js';
import { DEFAULT_PICKS, BY_ID, EXTRA_STOPS } from './data/activities.js';
import { STOPS } from './data/trip.js';
import { STRATEGIES } from './strategies.js';
import { findHop } from './data/hops.js';
import { encodeVotes, mergeVotes, MAX_VOTERS } from './votes.js';

// Share a plan as a URL: ?p=<base64url JSON>. Versioned, so an old link still
// opens; anything unknown or out of range is dropped rather than trusted.
// Only SHAREABLE plan data travels — never the checklist, documents, ledger,
// photos, GPS or keys — and opening a link resets only those same fields.
// Votes (first names + hearted ids) ride along too, but MERGE instead of
// replace, so a friend's link adds their hearts to yours.

const VERSION = 1;
const DIALS = { travellers: [1, 6], bed: [200, 6000], food: [200, 4000], local: [50, 2500], buffer: [0, 40] };
const STOP_IDS = new Set([...STOPS, ...EXTRA_STOPS].map((s) => s.id));
const SLOTS = new Set(['am', 'pm', 'night', 'any', 'day']);

const b64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

export const encodePlan = (state) => {
  const on = Object.keys(state.picks).filter((id) => state.picks[id] && !DEFAULT_PICKS[id]);
  const off = Object.keys(DEFAULT_PICKS).filter((id) => !state.picks[id]);
  const custom = (state.custom || []).map(({ id, stop, slot, h, name, note, inr, kind }) => ({ id, stop, slot, h, name, note, inr, kind }));
  const order = Object.fromEntries(Object.entries(state.order || {}).filter(([, ids]) => ids?.length));
  const hops = Object.fromEntries(Object.entries(state.hops || {}).filter(([id, w]) => findHop(id)?.ways.some((x) => x.id === w)));
  const votes = encodeVotes(state);
  const payload = { v: VERSION, s: state.strategy, b: state.berth, on, off, custom, order, hops, ...(votes.length ? { votes } : {}) };
  Object.keys(DIALS).forEach((k) => { payload[k] = state[k]; });
  return b64(JSON.stringify(payload));
};

export const shareUrl = (state) => {
  const u = new URL(location.href);
  u.pathname = u.pathname.replace(/[^/]*$/, 'days.html');
  u.search = '';
  u.hash = '';
  u.searchParams.set('p', encodePlan(state));
  return u.toString();
};

const cleanCustom = (x) => {
  if (!x || typeof x !== 'object' || typeof x.name !== 'string' || !STOP_IDS.has(x.stop) || !SLOTS.has(x.slot)) return null;
  const h = Number(x.h);
  if (!Number.isFinite(h) || h <= 0 || h > 12) return null;
  const inr = Math.max(0, Math.min(50000, Math.round(Number(x.inr)) || 0));
  return { id: `ai-${String(x.id || x.name).replace(/^ai-/, '').replace(/[^a-z0-9-]/gi, '').slice(0, 32)}`, stop: x.stop, slot: x.slot, h, name: x.name.slice(0, 80), note: typeof x.note === 'string' ? x.note.slice(0, 120) : 'added by Gemini · estimate', inr, free: inr <= 0, kind: x.kind === 'see' ? 'see' : 'fun', icon: 'sparkle', est: true };
};

// Returns a state patch, or null when the payload is not a plan we recognise.
export const decodePlan = (p) => {
  let d;
  try { d = JSON.parse(unb64(p)); } catch { return null; }
  if (!d || typeof d !== 'object' || !(d.v >= 1 && d.v <= VERSION)) return null;
  const patch = { picks: { ...DEFAULT_PICKS }, custom: [] };
  if (STRATEGIES.some((s) => s.id === d.s)) patch.strategy = d.s;
  if (d.b === '4' || d.b === '6') patch.berth = d.b;
  Object.entries(DIALS).forEach(([k, [lo, hi]]) => {
    const n = Math.round(Number(d[k]));
    if (Number.isFinite(n) && n >= lo && n <= hi) patch[k] = n;
  });
  patch.custom = (Array.isArray(d.custom) ? d.custom : []).map(cleanCustom).filter(Boolean).slice(0, 20);
  const known = new Set([...Object.keys(BY_ID), ...patch.custom.map((x) => x.id)]);
  (Array.isArray(d.off) ? d.off : []).forEach((id) => { if (known.has(id)) patch.picks[id] = false; });
  (Array.isArray(d.on) ? d.on : []).forEach((id) => { if (known.has(id)) patch.picks[id] = true; });
  patch.order = {};
  if (d.order && typeof d.order === 'object') {
    Object.entries(d.order).forEach(([n, ids]) => {
      if (/^[1-8]$/.test(n) && Array.isArray(ids)) patch.order[n] = ids.filter((id) => known.has(id)).slice(0, 12);
    });
  }
  patch.hops = {};
  if (d.hops && typeof d.hops === 'object') {
    Object.entries(d.hops).forEach(([id, w]) => { if (findHop(id)?.ways.some((x) => x.id === w)) patch.hops[id] = w; });
  }
  patch.votes = (Array.isArray(d.votes) ? d.votes : [])
    .filter((v) => v && typeof v.n === 'string' && Array.isArray(v.h))
    .map((v) => ({ n: v.n.trim().slice(0, 24), h: v.h.filter((id) => known.has(id)) }))
    .filter((v) => v.n && v.h.length)
    .slice(0, MAX_VOTERS);
  return patch;
};

// On load: if the URL carries a plan, apply it and drop the param so a reload
// does not re-apply over later edits. Returns 'applied', 'bad' or null.
export function restoreShared(store) {
  const u = new URL(location.href);
  const p = u.searchParams.get('p');
  if (!p) return null;
  const patch = decodePlan(p);
  u.searchParams.delete('p');
  history.replaceState(null, '', u.toString());
  if (!patch) return 'bad';
  const fresh = structuredClone(DEFAULT_STATE);
  const known = new Set([...Object.keys(BY_ID), ...patch.custom.map((x) => x.id)]);
  const merged = mergeVotes(store.get(), patch.votes, known);
  store.set({ ...Object.fromEntries(SHAREABLE.map((k) => [k, k in patch ? patch[k] : fresh[k]])), ...(merged || {}) });
  return 'applied';
}
