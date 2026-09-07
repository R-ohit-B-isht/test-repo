// Auto-grouping of picked places/experiences onto days. Pure: (day blocks, picks)
// → what lands on which day and what could not be scheduled, with the reason.
// Rules: an item only goes on a day whose base island can reach it; a day holds
// at most MAX_PER_DAY slots (`cap` lowers it on half days); paired items share a day;
// otherwise the least-loaded eligible day wins so no day gets crammed.
import { CATALOGUE, MAX_PER_DAY } from './data/catalogue.js';

const SCHEDULABLE = new Set(['base', 'excursion', 'nolanding']);

// A package shore day has no time for side boats: only on-foot items fit there.
const canHost = (day, item) => item.bases.includes(day.base) && !(day.pkg && item.reach !== 'base');

// why: reach id when the item itself is the blocker, 'offroute' when the route
// never sleeps on a base island for it, 'shoreday' when it only passes through on
// a package day, 'full' when every eligible day is booked.
export function feasibility(item, days) {
  if (!SCHEDULABLE.has(item.reach)) return { ok: false, why: item.reach };
  const near = days.filter((d) => item.bases.includes(d.base));
  if (!near.length) return { ok: false, why: 'offroute' };
  if (!near.some((d) => canHost(d, item))) return { ok: false, why: 'shoreday' };
  return { ok: true, why: item.reach };
}

function chooseDay(item, days, load, dayOf) {
  const fits = (i) => canHost(days[i], item) && load[i] + item.slots <= (days[i].cap ?? MAX_PER_DAY);
  const buddy = dayOf[item.pair];
  if (buddy !== undefined && fits(buddy)) return buddy;
  let best = -1;
  days.forEach((_, i) => { if (fits(i) && (best < 0 || load[i] < load[best])) best = i; });
  return best;
}

export function schedulePicks(days, picks) {
  const load = days.map(() => 0);
  const placed = days.map(() => []);
  const skipped = [];
  const dayOf = {};
  for (const item of CATALOGUE) {
    if (!picks[item.id]) continue;
    const feas = feasibility(item, days);
    if (!feas.ok) { skipped.push({ item, why: feas.why }); continue; }
    const i = chooseDay(item, days, load, dayOf);
    if (i < 0) { skipped.push({ item, why: 'full' }); continue; }
    placed[i].push(item);
    load[i] += item.slots;
    dayOf[item.id] = i;
  }
  return { placed, skipped };
}

export const SKIP_REASON = {
  offroute: 'not on this route',
  full: 'days are full',
  shoreday: 'shore day: no side boats',
  portcall: 'needs a ship port call',
  overnight: 'needs a night there',
  noaccess: 'no boats run there',
};
