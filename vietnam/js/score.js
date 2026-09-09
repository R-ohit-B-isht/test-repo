import { catalogOf, lookup, isExtra, isFun } from './data/activities.js';
import { DAYS, SLOTS } from './data/days.js';
import { livePeople } from './split/model.js';
import { totals } from './split/math.js';
import { dayOf } from './plan.js';

// Trip score (fantasy-league style). Every place in the catalog is worth a
// fixed number of points by *how much fun it is*, the plan's score is the sum
// of what got packed, and each traveller collects points three ways:
//
//   planned  — hearts on picks that made it into the plan (votes.js)
//   paid     — rupees fronted for the group in Split (1 pt per ₹100 net)
//   showed   — ticked "was there" on a placed pick, `state.present[id][pid]`
//
// Points are house rules, shown next to every figure; nothing here is
// sourced or "real" beyond the plan, the hearts, the ledger and the ticks.

export const RULES = [
  { id: 'must', label: 'Must-do', pts: 30, test: (x) => !!x.must },
  { id: 'park', label: 'Theme park / cruise', pts: 25, test: (x) => x.tag === 'park' || x.spans > 1 },
  { id: 'night', label: 'Night out', pts: 15, test: (x) => x.tag === 'night' },
  { id: 'fun', label: 'Paid fun', pts: 20, test: (x) => isFun(x) && !x.free && !!(x.vnd || x.usd || x.inr) },
  { id: 'free', label: 'Free fun', pts: 10, test: (x) => isFun(x) },
  { id: 'see', label: 'Sight / stroll', pts: 5, test: () => true },
];

export const INR_PER_PT = 100;

export const ruleOf = (x) => RULES.find((r) => r.test(x));
export const pointsOf = (x) => ruleOf(x).pts;

export const TIERS = [
  { id: 'stroller', label: 'Stroller', min: 0, note: 'a walk and a coffee' },
  { id: 'wanderer', label: 'Wanderer', min: 150, note: 'a few big days' },
  { id: 'adventurer', label: 'Adventurer', min: 280, note: 'parks, boats, nights' },
  { id: 'legend', label: 'Legend', min: 360, note: 'every day packed' },
];
export const tierOf = (pts) => [...TIERS].reverse().find((t) => pts >= t.min);
export const nextTier = (pts) => TIERS.find((t) => t.min > pts) || null;

// Placed or seen picks per day, in day order, with their points.
const dayItems = (d) => {
  const seen = new Set();
  const out = [];
  SLOTS.forEach((k) => d.slots[k].items.forEach((x) => { if (!x.cont && !seen.has(x.id)) { seen.add(x.id); out.push(x); } }));
  d.see.forEach((x) => { if (!seen.has(x.id)) { seen.add(x.id); out.push(x); } });
  return out;
};

export const showedBy = (state, id) => Object.keys(state.present?.[id] || {}).filter((pid) => state.present[id][pid] === 'showed');
export const hasShowed = (state, id, pid) => state.present?.[id]?.[pid] === 'showed';

// Plan score: what the packed days are worth, day by day.
export function tripScore(state, plan) {
  const days = plan.days.map((d, i) => {
    const items = dayItems(d).map((x) => ({ x, pts: pointsOf(x), rule: ruleOf(x) }));
    return { n: d.n, title: DAYS[i].title, items, pts: items.reduce((s, r) => s + r.pts, 0) };
  });
  const pts = days.reduce((s, d) => s + d.pts, 0);
  const fun = days.reduce((s, d) => s + d.items.filter((r) => isFun(r.x)).length, 0);
  const best = days.reduce((a, b) => (b.pts > a.pts ? b : a), days[0]);
  const bench = plan.noRoom.map((id) => lookup(state, id)).filter(Boolean).map((x) => ({ x, pts: pointsOf(x) }));
  return { pts, fun, days, best, bench, tier: tierOf(pts), next: nextTier(pts) };
}

// Highest-value picks that are off or off-route: what would lift the score.
export const upgrades = (state, plan, n = 4) => catalogOf(state)
  .filter((x) => !state.picks[x.id] && !x.closed && !isExtra(x) && isFun(x) && !plan.bundled.has(x.id))
  .map((x) => ({ x, pts: pointsOf(x) }))
  .sort((a, b) => b.pts - a.pts)
  .slice(0, n);

// One traveller's line: planned / paid / showed with the items behind each.
function lineFor(state, plan, t, p) {
  const inPlan = (id) => dayOf(plan, id) != null;
  const planned = catalogOf(state).filter((x) => state.hearts?.[x.id]?.[p.id] && inPlan(x.id)).map((x) => ({ x, pts: pointsOf(x) }));
  const showed = catalogOf(state).filter((x) => hasShowed(state, x.id, p.id) && inPlan(x.id)).map((x) => ({ x, pts: pointsOf(x) }));
  const fronted = Math.max(0, (t.paid[p.id] || 0) - (t.share[p.id] || 0));
  const sum = (rows) => rows.reduce((s, r) => s + r.pts, 0);
  const cols = { planned: sum(planned), paid: Math.round(fronted / INR_PER_PT), showed: sum(showed) };
  return { p, cols, fronted, planned, showed, total: cols.planned + cols.paid + cols.showed };
}

// Standings, best first; ties share a rank. `zone` splits the table like a
// league: the top third are promoted, the rest are chasing.
export function standings(state, plan) {
  const people = livePeople(state);
  const t = totals(state);
  const rows = people.map((p) => lineFor(state, plan, t, p)).sort((a, b) => b.total - a.total || a.p.name.localeCompare(b.p.name));
  let rank = 0;
  rows.forEach((r, i) => { if (i === 0 || r.total < rows[i - 1].total) rank = i + 1; r.rank = rank; });
  const top = rows.length > 2 ? Math.max(1, Math.ceil(rows.length / 3)) : 1;
  rows.forEach((r, i) => { r.zone = rows.length > 1 && r.total > 0 && i < top ? 'top' : 'chase'; });
  const leader = rows[0]?.total > 0 ? rows[0] : null;
  const scored = rows.some((r) => r.total > 0);
  return { rows, leader, scored, split: rows.length > 1 && scored ? top : 0 };
}

// Match sheet: for every day, who showed at what. Rows only for what the plan
// actually holds; people are Split's people, so a name is one record app-wide.
export const matchSheet = (state, plan) => tripScore(state, plan).days.map((d) => ({
  ...d,
  items: d.items.map((r) => ({ ...r, who: showedBy(state, r.x.id) })),
}));

// Toggle patch for "was there" — a Command-style edit the store applies.
export const toggleShowed = (state, id, pid) => {
  const row = { ...(state.present?.[id] || {}) };
  if (row[pid] === 'showed') delete row[pid]; else row[pid] = 'showed';
  return { present: { ...(state.present || {}), [id]: row } };
};

// Prompt for the plan brain: lift the score without wrecking the budget.
export const scorePrompt = (score, ups) => `Our trip score is ${score.pts} pts (${score.tier.label}). ${score.next ? `Next tier ${score.next.label} needs ${score.next.min - score.pts} more.` : ''} Highest-value picks that are off: ${ups.map((u) => `${u.x.id} (+${u.pts})`).join(', ')}. Switch on what lifts the score most per rupee, keep every must-do, and say what it costs.`;
