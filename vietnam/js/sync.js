// Room sync model (F16). Pure: no fetch, no DOM, no store.
//
// The room holds a flat document `{ key: [value, stamp] }` — one entry per plan
// dial, per pick, per hop, per heart, per person / expense / custom spot /
// event. Last writer (highest stamp) wins per key, on the server and here.
// `flatten` turns state into that map; `diff` finds what changed since the
// last document we agreed on; `applyFields` turns a document back into a state
// patch. Only SYNC_SCALARS + SYNC_MAPS + SYNC_LISTS travel — never documents,
// photos, GPS, cash, keys or who "you" are on this phone.

export const SYNC_SCALARS = ['strategy', 'travellers', 'berth', 'bed', 'food', 'local', 'buffer'];
export const SYNC_MAPS = ['picks', 'order', 'hops'];
export const SYNC_NESTED = ['hearts', 'present'];
export const SYNC_LISTS = ['custom', 'people', 'expenses', 'events'];
// Per-device fields on a synced record: dropped before push, re-derived on apply.
const LOCAL_ONLY = { people: ['me'], expenses: ['receipt'] };

const stable = (v) => JSON.stringify(v);

const strip = (list, rec) => {
  const drop = LOCAL_ONLY[list];
  if (!drop) return rec;
  const out = { ...rec };
  drop.forEach((k) => { delete out[k]; });
  return out;
};

// state → { key: value }
export function flatten(state) {
  const f = {};
  SYNC_SCALARS.forEach((k) => { f[k] = state[k]; });
  SYNC_MAPS.forEach((m) => Object.entries(state[m] || {}).forEach(([id, v]) => {
    if (m === 'picks') { f[`picks.${id}`] = !!v; return; }
    if (v == null || (Array.isArray(v) && !v.length)) return;
    f[`${m}.${id}`] = v;
  }));
  SYNC_NESTED.forEach((m) => Object.entries(state[m] || {}).forEach(([aid, per]) => Object.entries(per || {}).forEach(([pid, v]) => {
    if (v) f[`${m}.${aid}.${pid}`] = v;
  })));
  SYNC_LISTS.forEach((l) => (state[l] || []).forEach((rec) => {
    if (rec && typeof rec.id === 'string') f[`${l}.${rec.id}`] = strip(l, rec);
  }));
  return f;
}

// What changed locally since `base` (the last agreed document). Returns
// `{ key: [value, now] }`; a key that vanished becomes a null tombstone.
export function diff(base, flat, now) {
  const out = {};
  Object.keys(flat).forEach((k) => {
    if (!base[k] || stable(base[k][0]) !== stable(flat[k])) out[k] = [flat[k], now];
  });
  Object.keys(base).forEach((k) => {
    if (!(k in flat) && base[k][0] !== null) out[k] = [null, now];
  });
  return out;
}

const splitKey = (k) => {
  const i = k.indexOf('.');
  return i < 0 ? [k, ''] : [k.slice(0, i), k.slice(i + 1)];
};

// document → state patch. Local-only fields survive: `me` comes back from
// state.me, a receipt stays with the row that holds it on this device.
export function applyFields(state, fields) {
  const patch = {};
  const maps = Object.fromEntries([...SYNC_MAPS, ...SYNC_NESTED].map((m) => [m, { ...(state[m] || {}) }]));
  SYNC_NESTED.forEach((m) => Object.keys(maps[m]).forEach((aid) => { maps[m][aid] = { ...(maps[m][aid] || {}) }; }));
  const lists = Object.fromEntries(SYNC_LISTS.map((l) => [l, [...(state[l] || [])]]));
  const touched = new Set();

  Object.entries(fields).forEach(([k, entry]) => {
    if (!Array.isArray(entry)) return;
    const v = entry[0];
    const [head, rest] = splitKey(k);
    if (SYNC_SCALARS.includes(head) && !rest) {
      if (v !== null && v !== undefined) patch[head] = v;
    } else if (SYNC_MAPS.includes(head) && rest) {
      if (v === null) delete maps[head][rest]; else maps[head][rest] = v;
      touched.add(head);
    } else if (SYNC_NESTED.includes(head) && rest) {
      const [aid, pid] = splitKey(rest);
      if (!pid) return;
      maps[head][aid] = { ...(maps[head][aid] || {}) };
      if (v === null || v === false) delete maps[head][aid][pid]; else maps[head][aid][pid] = v;
      if (!Object.keys(maps[head][aid]).length) delete maps[head][aid];
      touched.add(head);
    } else if (SYNC_LISTS.includes(head) && rest && v && typeof v === 'object') {
      const list = lists[head];
      const i = list.findIndex((r) => r.id === rest);
      const local = i >= 0 ? list[i] : null;
      const keep = Object.fromEntries((LOCAL_ONLY[head] || []).filter((f) => local && f in local).map((f) => [f, local[f]]));
      const rec = { ...v, id: rest, ...keep };
      if (head === 'people') rec.me = rec.id === state.me;
      if (i >= 0) list[i] = rec; else list.push(rec);
      touched.add(head);
    }
  });

  touched.forEach((m) => { patch[m] = maps[m] || lists[m]; });
  if (touched.has('custom')) {
    const picks = { ...(patch.picks || state.picks) };
    lists.custom.forEach((c) => { if (c.deleted) delete picks[c.id]; });
    patch.picks = picks;
  }
  return patch;
}

export const sameState = (a, b) => stable(flatten(a)) === stable(flatten(b));

// Room codes: 6 chars, no 0/O/1/I/L — the server uses the same alphabet.
export const CODE_RE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/;
export const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
export const roomUrl = (base, code) => `${String(base).replace(/\/+$/, '')}/rooms/${code}`;
