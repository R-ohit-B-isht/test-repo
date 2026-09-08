// Auto-grouping of picked places/experiences onto days. Pure: (day blocks, picks)
// → what lands on which day and what could not be scheduled, with the reason.
// Rules: an item only goes on a day whose base island can reach it; a day holds
// at most MAX_PER_DAY slots (`cap` lowers it on half days); paired items share a day;
// otherwise the least-loaded eligible day wins (full days before half days) so
// no day gets crammed. Extras (slots 0: strolls, look-ins) are placed last and
// join the busiest eligible day, EXTRAS_PER_DAY each unless nothing else fits.
import { CATALOGUE, CATALOGUE_BY_ID, MAX_PER_DAY, isExtra } from './data/catalogue.js';

const EXTRAS_PER_DAY = 2;

const SCHEDULABLE = new Set(['base', 'excursion', 'nolanding']);

// A package shore day has no time for side boats: only on-foot items fit there.
// A travel day lists the parts of the day that are free (`free`); a timed item
// (`when`) needs one of them.
const shoreOk = (day, item) => !(day.pkg && item.reach !== 'base');
const timeOk = (day, item) => !item.when || !day.free || day.free.includes(item.when);
const canHost = (day, item) => item.bases.includes(day.base) && shoreOk(day, item) && timeOk(day, item);

// why: reach id when the item itself is the blocker, 'offroute' when the route
// never sleeps on a base island for it, 'shoreday' when it only passes through on
// a package day, 'timing' when the free hours never match, 'full' when booked.
export function feasibility(item, days) {
  if (!SCHEDULABLE.has(item.reach)) return { ok: false, why: item.reach };
  const near = days.filter((d) => item.bases.includes(d.base));
  if (!near.length) return { ok: false, why: 'offroute' };
  if (!near.some((d) => canHost(d, item))) return { ok: false, why: near.some((d) => shoreOk(d, item)) ? 'timing' : 'shoreday' };
  return { ok: true, why: item.reach };
}

const cap = (day) => day.cap ?? MAX_PER_DAY;

// Pairs read both ways: Thinnakara says `pair: 'bangaram'`, so Bangaram knows too.
const PARTNER = Object.fromEntries(CATALOGUE.filter((c) => c.pair).flatMap((c) => [[c.id, CATALOGUE_BY_ID[c.pair]], [c.pair, c]]));

// Slots to reserve: the item plus a picked, still-unplaced partner it should share a day with.
function need(item, picks, dayOf) {
  const partner = PARTNER[item.id];
  const pending = partner && picks[partner.id] && dayOf[partner.id] === undefined;
  return item.slots + (pending ? partner.slots : 0);
}

function pickBest(days, ok, better) {
  let best = -1;
  days.forEach((d, i) => { if (ok(i) && (best < 0 || better(i, best))) best = i; });
  return best;
}

function chooseDay(item, days, load, dayOf, extras, picks) {
  const host = (i) => canHost(days[i], item);
  const buddy = dayOf[PARTNER[item.id]?.id];
  if (isExtra(item)) {
    if (buddy !== undefined) return buddy;
    const busiest = (a, b) => load[a] > load[b] || (load[a] === load[b] && extras[a] < extras[b]);
    const i = pickBest(days, (i) => host(i) && extras[i] < EXTRAS_PER_DAY, busiest);
    return i >= 0 ? i : pickBest(days, host, busiest);
  }
  const fits = (i) => host(i) && load[i] + need(item, picks, dayOf) <= cap(days[i]);
  if (buddy !== undefined && host(buddy) && load[buddy] + item.slots <= cap(days[buddy])) return buddy;
  const lightest = (a, b) => load[a] < load[b] || (load[a] === load[b] && cap(days[a]) > cap(days[b]));
  return pickBest(days, fits, lightest);
}

export function schedulePicks(days, picks) {
  const load = days.map(() => 0);
  const extras = days.map(() => 0);
  const placed = days.map(() => []);
  const skipped = [];
  const dayOf = {};
  const order = [...CATALOGUE].sort((a, b) => isExtra(a) - isExtra(b));
  for (const item of order) {
    if (!picks[item.id]) continue;
    const feas = feasibility(item, days);
    if (!feas.ok) { skipped.push({ item, why: feas.why }); continue; }
    const i = chooseDay(item, days, load, dayOf, extras, picks);
    if (i < 0) { skipped.push({ item, why: 'full' }); continue; }
    placed[i].push(item);
    load[i] += item.slots;
    if (isExtra(item)) extras[i] += 1;
    dayOf[item.id] = i;
  }
  return { placed, skipped };
}

// Unpicked items that would land on this (already scheduled) day if ticked:
// majors while slots remain, then extras. Powers the "add here" chips on a day card.
export function openings(day, picks, limit = 3) {
  const load = day.picks.reduce((s, p) => s + p.slots, 0);
  const room = cap(day) - load;
  return CATALOGUE
    .filter((c) => !picks[c.id] && SCHEDULABLE.has(c.reach) && canHost(day, c) && (isExtra(c) || c.slots <= room))
    .sort((a, b) => isExtra(a) - isExtra(b))
    .slice(0, limit);
}

export const SKIP_REASON = {
  offroute: 'not on this route',
  full: 'days are full',
  shoreday: 'shore day: no side boats',
  timing: 'no free hours for it',
  portcall: 'needs a ship port call',
  overnight: 'needs a night there',
  noaccess: 'no boats run there',
};
