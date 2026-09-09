import { SLOTS } from './data/days.js';
import { pinOf, travelBetween } from './data/geo.js';
import { movableOf, reordered } from './plan.js';

// Road logic for one packed day: what sits between two picks in sequence, how
// long the whole walk is, and the shortest feasible order. Works on the day
// the packer produced, so a train or flight slot between two picks counts as
// the move (no Grab estimate on top), and any proposed order is run through
// the packer first so the saving shown is the saving you get.

export const HOP = 20;   // minutes between two picks in the same town, no pin
export const FAR = 60;   // minutes to the next town by Grab, no pin

export const slotOf = (d, x) => SLOTS.find((k) => d.slots[k].items.includes(x));

const transitBetween = (d, a, b) => {
  const i = SLOTS.indexOf(slotOf(d, a));
  const j = SLOTS.indexOf(slotOf(d, b));
  return SLOTS.slice(Math.min(i, j) + 1, Math.max(i, j)).map((k) => d.slots[k]).find((s) => s.fixed) || null;
};

// { kind: 'transit' | 'est' | 'flat', min, km?, label? }
export const hopOf = (d, a, b) => {
  const tr = transitBetween(d, a, b);
  if (tr) return { kind: 'transit', min: 0, label: tr.text };
  const est = travelBetween(a, b);
  if (est) return { kind: 'est', ...est };
  return { kind: 'flat', min: a.stop === b.stop ? HOP : FAR };
};

export const routeMinutes = (d, items) => items.slice(1).reduce((n, x, i) => n + hopOf(d, items[i], x).min, 0);

const ids = (items) => items.map((x) => x.id);
const same = (p, q) => p.length === q.length && p.every((x, i) => x === q[i]);

// The order the packer would actually show for a proposed id sequence.
export const preview = (d, seq) => movableOf(reordered(d, seq));

// Swapping i with i+dir: the feasible result, or null when the packer would
// put things straight back (a night show cannot go before an afternoon swim).
export const swapped = (d, items, i, dir) => {
  const seq = ids(items);
  const j = i + dir;
  if (j < 0 || j >= seq.length) return null;
  [seq[i], seq[j]] = [seq[j], seq[i]];
  const out = preview(d, seq);
  return same(ids(out), ids(items)) ? null : out;
};

// Nearest-neighbour walk inside each run of picks that has no transit between
// them; pinless picks keep their place at the end of their run. Returns the
// feasible order and the minutes it saves against the current one.
// Every order of the movable picks (MAX_PER_DAY keeps this tiny), each run
// through the packer so slot rules hold, keeping the one with the least
// road time. Only pinned picks can move the total, so unpinned ones stay put.
const permutations = (xs) => (xs.length < 2 ? [xs] : xs.flatMap((x, i) => permutations([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p])));

export const shortest = (d, items) => {
  const cur = ids(items);
  const base = routeMinutes(d, items);
  if (items.filter(pinOf).length < 2 || items.length > 7) return { order: items, saves: 0 };
  let best = { order: items, min: base };
  const seen = new Set([cur.join()]);
  permutations(cur).forEach((seq) => {
    const out = preview(d, seq);
    const key = ids(out).join();
    if (seen.has(key)) return;
    seen.add(key);
    const min = routeMinutes(d, out);
    if (min < best.min) best = { order: out, min };
  });
  return { order: best.order, saves: base - best.min };
};
