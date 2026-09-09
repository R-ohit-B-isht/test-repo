import { TRIP } from './data/trip.js';
import { stepsFor } from './data/checklist.js';
import { MICRO } from './data/ritual.js';
import { today, isoLocal } from './clock.js';

// Countdown ritual (Duolingo / Ahead): one tiny task a day until you fly, a
// streak for showing up, and a "you're ready" moment at T-1. Tasks are the
// booking steps (checklist.js) plus the micro tasks (data/ritual.js), served
// soonest-due first. State: ritual.dates = days you ticked, ritual.done =
// micro ids done; booking steps reuse state.checklist.

const DAY = 86400000;
const midnight = (iso) => new Date(`${iso}T00:00:00`);
export const shiftISO = (iso, days) => { const d = midnight(iso); d.setDate(d.getDate() + days); return isoLocal(d); };

export const daysLeft = () => Math.round((midnight(TRIP.start) - midnight(today())) / DAY);

// far: more than 60 days out · prep: the ritual window · eve: T-1 ·
// trip: on the road · after: home.
export const phaseOf = (left) => {
  if (left > 60) return 'far';
  if (left > 1) return 'prep';
  if (left === 1) return 'eve';
  if (left > -TRIP.days) return 'trip';
  return 'after';
};
export const tripDay = (left) => 1 - left;

export const tasksFor = (state) => {
  const done = new Set(state.ritual?.done || []);
  const steps = stepsFor(state.strategy).map((c) => ({ id: c.id, icon: c.icon, title: c.title, hint: c.hint, lead: c.lead, step: true, src: c, done: !!state.checklist[c.id] }));
  const micro = MICRO.map((m) => ({ ...m, step: false, done: done.has(m.id) }));
  return [...steps, ...micro].sort((a, b) => b.lead - a.lead);
};

export const dueOf = (task) => shiftISO(TRIP.start, -task.lead);
export const isOverdue = (task, left) => task.lead > left;

export const tickedToday = (state) => (state.ritual?.dates || []).includes(today());

export const streak = (state) => {
  const have = new Set(state.ritual?.dates || []);
  let d = today();
  if (!have.has(d)) d = shiftISO(d, -1);
  let n = 0;
  while (have.has(d)) { n += 1; d = shiftISO(d, -1); }
  return n;
};

export const bestStreak = (state) => {
  const days = [...new Set(state.ritual?.dates || [])].sort();
  let best = 0; let run = 0; let prev = null;
  days.forEach((d) => { run = prev && shiftISO(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; });
  return best;
};

// Last seven days ending today: [{ iso, letter, hit, isToday }].
export const week = (state) => {
  const have = new Set(state.ritual?.dates || []);
  const t = today();
  return Array.from({ length: 7 }, (_, i) => {
    const iso = shiftISO(t, i - 6);
    return { iso, letter: midnight(iso).toLocaleDateString('en-IN', { weekday: 'narrow' }), hit: have.has(iso), isToday: iso === t };
  });
};

// What the card should serve right now.
export const serve = (state) => {
  const left = daysLeft();
  const tasks = tasksFor(state);
  const open = tasks.filter((t) => !t.done);
  const next = open[0] || null;
  return {
    left,
    phase: phaseOf(left),
    next,
    overdue: open.filter((t) => t !== next && isOverdue(t, left)),
    openCount: open.length,
    doneCount: tasks.length - open.length,
    total: tasks.length,
    ticked: tickedToday(state),
    streak: streak(state),
    best: bestStreak(state),
    week: week(state),
  };
};
