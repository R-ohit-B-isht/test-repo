import { TRIP, isoOf } from '../data/trip.js';
import { stepsFor } from '../data/checklist.js';
import { PRICES } from '../data/prices.js';
import { findStrategy } from '../strategies.js';
import { planTrip, dayOf } from '../plan.js';
import { stays, stepLinks, ticketLinks } from '../book.js';
import { addDays } from '../export/dates.js';

// The Manager's slots: one per thing you must hold in hand at some point —
// papers, tickets, beds, the eSIM. Derived from the same checklist, route legs,
// stays and paid picks the rest of the planner uses, so changing the route or
// a pick adds / removes slots here too. Each slot is a description only; what
// you filled in (status, ref, files) is the record in `state.vault[slot.id]`.

export const GROUPS = [
  { id: 'papers', label: 'Papers', icon: 'passport' },
  { id: 'fly', label: 'Fly', icon: 'plane' },
  { id: 'ride', label: 'Ride', icon: 'train' },
  { id: 'sleep', label: 'Sleep', icon: 'bed' },
  { id: 'play', label: 'Play', icon: 'ticket' },
  { id: 'stuff', label: 'Stuff', icon: 'sparkle' },
];

export const STAGES = {
  book: ['To do', 'Booked', 'Confirmed'],
  paper: ['To do', 'Applied', 'In hand'],
  have: ['To do', 'Sorted', 'Done'],
};
export const STATUS = ['todo', 'mid', 'done'];

// Passport must be valid six months past the day you leave Vietnam.
const LEAVE = isoOf(TRIP.days);
export const PASSPORT_MIN = addDays(LEAVE, 183);

const PASSPORT = {
  id: 'passport', group: 'papers', icon: 'passport', title: 'Passport', stages: STAGES.paper,
  hint: `Valid past ${PASSPORT_MIN.slice(0, 7)} (6 months after you leave) with two blank pages.`,
  dateLabel: 'Expires', by: addDays(TRIP.start, -45), links: [],
};

const GROUP_OF = { evisa: 'papers', insure: 'papers', sim: 'stuff', cash: 'stuff', rain: 'stuff' };
const STAGE_OF = { evisa: STAGES.paper, insure: STAGES.paper, sim: STAGES.have, cash: STAGES.have, rain: STAGES.have };
// Beds and tickets get one slot per hostel / per paid pick instead of the
// checklist's grouped steps.
const SKIP = new Set(['centralBed', 'hanoiBed', 'parks', 'tours']);
const skipStep = (c) => SKIP.has(c.link);

const legDate = (c) => (c.price && PRICES[c.price]?.iso) || null;

const fromStep = (c, state) => ({
  id: c.id, group: GROUP_OF[c.id] || (c.icon === 'plane' ? 'fly' : 'ride'), icon: c.icon, title: c.title, hint: c.hint,
  stages: STAGE_OF[c.id] || STAGES.book, when: legDate(c), by: addDays(TRIP.start, -c.lead), links: stepLinks(c, state),
  dateLabel: c.id === 'evisa' ? 'Valid from' : c.id === 'insure' ? 'Cover starts' : null,
});

const fromStay = (r) => ({
  id: `stay-${r.stop}-${r.from}`, group: 'sleep', icon: 'bed', title: r.name, stages: STAGES.book,
  hint: `${r.city} · ${r.nights} night${r.nights > 1 ? 's' : ''} · free-cancellation dorm`, when: r.from, till: r.to,
  by: addDays(TRIP.start, -14), links: r.links,
});

const fromPick = (x, dayN, state) => ({
  id: `tix-${x.id}`, group: 'play', icon: 'ticket', title: x.name, stages: STAGES.book,
  hint: x.note || 'Ticket or tour', when: dayN ? isoOf(dayN) : null, by: addDays(TRIP.start, -5), links: ticketLinks(x, dayN),
  x, ...(state.custom.some((c) => c.id === x.id) ? { estimate: true } : {}),
});

const fromCustom = (c) => ({
  id: c.id, group: c.group || 'stuff', icon: c.icon || 'file', title: c.title, hint: c.hint || 'Added by you', stages: STAGES.have,
  dateLabel: 'Date', links: [], custom: true,
});

const paidPicks = (state) => {
  const transit = findStrategy(state.strategy).transit;
  const plan = planTrip(state, transit);
  return plan.paid.map((x) => fromPick(x, dayOf(plan, x.id), state));
};

export function slotsFor(state) {
  const steps = stepsFor(state.strategy).filter((c) => !skipStep(c)).map((c) => fromStep(c, state));
  const out = [PASSPORT, ...steps, ...stays(state).map(fromStay), ...paidPicks(state), ...state.vaultCustom.map(fromCustom)];
  return out.filter((s) => !state.vault[s.id]?.deleted);
}

export const binFor = (state) => state.vaultCustom.filter((c) => state.vault[c.id]?.deleted).map(fromCustom);

export const recordOf = (state, id) => ({ status: 'todo', ref: '', note: '', date: '', files: [], ...(state.vault[id] || {}) });
export const liveFiles = (rec) => rec.files.filter((f) => !f.deleted);
export const stageLabel = (slot, status) => slot.stages[STATUS.indexOf(status)] || slot.stages[0];

// Passport expiry is the one date the app can judge for you.
export const passportWarning = (rec) => (rec.date && rec.date < PASSPORT_MIN ? `Expires before ${PASSPORT_MIN} · renew first` : null);

export const groupSlots = (slots) => GROUPS.map((g) => ({ ...g, slots: slots.filter((s) => s.group === g.id) })).filter((g) => g.slots.length);
export const progressOf = (state, slots) => ({ done: slots.filter((s) => recordOf(state, s.id).status === 'done').length, total: slots.length });
