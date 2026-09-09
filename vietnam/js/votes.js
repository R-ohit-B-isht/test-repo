import { catalogOf, isExtra } from './data/activities.js';
import { livePeople, newId, nextHue } from './split/model.js';
import { dayOf } from './plan.js';

// Hearts: who wants what. `state.hearts[activityId][personId] = true`, people
// are the same records Split uses, so "you" is one name across the app.
//
// Friends vote from their own phone: a share link carries every voter's name
// and hearted ids; opening it MERGES those votes into this browser (matched by
// name, a new name becomes a person) and never removes a heart already here.

export const MAX_VOTERS = 12;

export const heartsOf = (state, id) => {
  const live = new Set(livePeople(state).map((p) => p.id));
  return Object.keys(state.hearts?.[id] || {}).filter((pid) => state.hearts[id][pid] && live.has(pid));
};

export const heartCount = (state, id) => heartsOf(state, id).length;
export const iHeart = (state, id) => !!(state.me && state.hearts?.[id]?.[state.me]);

export const lovedBy = (state, id) => heartsOf(state, id)
  .map((pid) => (pid === state.me ? 'you' : livePeople(state).find((p) => p.id === pid)?.name))
  .filter(Boolean);

export const totalHearts = (state) => catalogOf(state).reduce((n, x) => n + heartCount(state, x.id), 0);

// Most-wanted first; ties keep catalog order.
export const leaderboard = (state) => catalogOf(state)
  .map((x) => ({ x, n: heartCount(state, x.id), names: lovedBy(state, x.id) }))
  .filter((r) => r.n > 0)
  .sort((a, b) => b.n - a.n);

export const votesByPerson = (state) => livePeople(state).map((p) => ({
  p,
  n: catalogOf(state).filter((x) => state.hearts?.[x.id]?.[p.id]).length,
}));

// Where the group's hearts and the plan disagree:
//   off      — wanted, but switched off
//   noroom   — wanted and on, but the day is full
//   unloved  — a paid pick that is on with no heart from anyone (only once
//              someone has voted, so an empty board is not all "conflicts")
export const conflicts = (state, plan) => {
  const voted = totalHearts(state) > 0;
  const out = [];
  catalogOf(state).forEach((x) => {
    if (x.closed || isExtra(x)) return;
    const names = lovedBy(state, x.id);
    const on = !!state.picks[x.id];
    if (names.length && !on && !plan.bundled.has(x.id)) out.push({ x, kind: 'off', names });
    else if (names.length && on && plan.noRoom.includes(x.id)) out.push({ x, kind: 'noroom', names });
    else if (voted && on && !names.length && (x.vnd || x.usd) && dayOf(plan, x.id) != null && !x.must) out.push({ x, kind: 'unloved', names });
  });
  const rank = { off: 0, noroom: 1, unloved: 2 };
  return out.sort((a, b) => rank[a.kind] - rank[b.kind] || b.names.length - a.names.length);
};

export const conflictPrompt = (list) => {
  const lines = list.slice(0, 12).map(({ x, kind, names }) => {
    if (kind === 'off') return `${x.id} is off but ${names.join(', ')} want it`;
    if (kind === 'noroom') return `${x.id} has no room but ${names.join(', ')} want it`;
    return `${x.id} is on and paid but nobody hearted it`;
  });
  return `Resolve our votes. ${lines.join('; ')}. Switch on what most people want, drop unloved paid picks first to make room, and tell me who loses out.`;
};

// Share payload: [{ n: name, h: [ids] }] for voters with at least one heart.
export const encodeVotes = (state) => livePeople(state)
  .map((p) => ({ n: p.name, h: catalogOf(state).filter((x) => state.hearts?.[x.id]?.[p.id]).map((x) => x.id) }))
  .filter((v) => v.h.length)
  .slice(0, MAX_VOTERS);

// Merge incoming votes: an existing name (case-insensitive) keeps its id, a new
// one becomes a person. Returns the patch, or null when there is nothing new.
export const mergeVotes = (state, votes, known) => {
  const people = [...state.people];
  const hearts = structuredClone(state.hearts || {});
  let changed = false;
  votes.forEach((v) => {
    const name = String(v.n || '').trim().slice(0, 24);
    const ids = Array.isArray(v.h) ? v.h.filter((id) => known.has(id)).slice(0, 80) : [];
    if (!name || !ids.length) return;
    let p = people.find((q) => !q.deleted && q.name.toLowerCase() === name.toLowerCase());
    if (!p) {
      if (people.filter((q) => !q.deleted).length >= MAX_VOTERS) return;
      p = { id: newId('p'), name, hue: nextHue({ people }), me: false, created: Date.now() };
      people.push(p);
      changed = true;
    }
    ids.forEach((id) => {
      if (hearts[id]?.[p.id]) return;
      hearts[id] = { ...(hearts[id] || {}), [p.id]: true };
      changed = true;
    });
  });
  return changed ? { people, hearts } : null;
};
