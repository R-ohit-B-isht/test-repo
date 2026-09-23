/** Deterministic week builder. Given the items a person wants, it decides which day and slot each one gets so that
 * strong actives (retinoid, acids, BPO, physical exfoliation) never share a night, pairs the knowledge base flags as
 * avoid/caution never share a slot, mornings end in sunscreen, and every slot stays a sane number of layers. Anything it
 * cannot honour is reported as a warning instead of being quietly dropped. No model call is involved. */
import { DAYS, DAY_LABEL, type Day, type PlanZone, type Slot } from '../model';
import { type CatalogItem, type Role } from './catalog';
import { catalogItem, type InventoryItem } from './inventory';
import type { PairingRules, RuleHit } from './rules';

export interface PlanStep {
  /** `${key}:${slot}` — stable across re-runs so picks and proposals can be matched back. */
  id: string;
  key: string;
  label: string;
  role: Role;
  family: string | null;
  zone: PlanZone;
  slot: Slot;
  days: Day[];
  /** Ranked page to pick from (first catalog category present in the manifest), or null when the site has no page yet. */
  category: string | null;
  tags: string[];
  query: string | null;
  hint: string | null;
  /** Ingredient-only items this step carries (glycerin, ceramides…). */
  carries: string[];
  notes: string[];
}

export type WarningKind = 'reduced' | 'unplaced' | 'zone' | 'rest' | 'no-page' | 'skin' | 'layers';
export interface PlanWarning { kind: WarningKind; text: string; keys: string[] }

export interface WeekPlan {
  steps: PlanStep[];
  warnings: PlanWarning[];
  restNights: Day[];
  /** Per day × slot, which step ids land there, in application order. */
  cells: Record<Day, Record<Slot, string[]>>;
  /** The rules that shaped the plan (for the compatibility review). */
  rulesUsed: RuleHit[];
}

export interface PlanOptions {
  restNights: number;
  sensitive: boolean;
  /** Category ids that exist in the manifest. */
  categories: ReadonlySet<string>;
}

const TREAT_CAP: Record<Slot, number> = { am: 3, pm: 3 };
const ROLE_ORDER: Record<Role, number> = { core: 0, hydrate: 1, treat: 2, active: 3, protect: 4 };

interface Cell { steps: PlanStep[] }

const stepId = (key: string, slot: Slot) => `${key}:${slot}`;

function spread(count: number, free: number[]): number[] {
  const picked: number[] = [];
  const pool = [...free];
  for (let i = 0; i < count && pool.length; i++) {
    const ideal = Math.round((i * 7) / count);
    let best = 0;
    for (let j = 1; j < pool.length; j++) if (Math.abs(pool[j] - ideal) < Math.abs(pool[best] - ideal)) best = j;
    picked.push(pool.splice(best, 1)[0]);
  }
  return picked.sort((a, b) => a - b);
}

export function buildWeekPlan(inventory: InventoryItem[], opts: PlanOptions, rules: PairingRules): WeekPlan {
  const warnings: PlanWarning[] = [];
  const rulesUsed = new Map<string, RuleHit>();
  const grid: Record<Day, Record<Slot, Cell>> = Object.fromEntries(DAYS.map((d) => [d, { am: { steps: [] }, pm: { steps: [] } }])) as Record<Day, Record<Slot, Cell>>;
  const steps = new Map<string, PlanStep>();

  const resolved = inventory.map((inv) => ({ inv, item: catalogItem(inv.key) }));
  const carried = resolved.filter(({ item }) => item.ingredientOnly);
  const real = resolved.filter(({ item }) => !item.ingredientOnly);

  const categoryFor = (item: CatalogItem) => item.categories.find((c) => opts.categories.has(c)) ?? null;

  const ensureStep = (item: CatalogItem, slot: Slot): PlanStep => {
    const id = stepId(item.key, slot);
    let s = steps.get(id);
    if (!s) {
      const category = categoryFor(item);
      s = { id, key: item.key, label: item.label, role: item.role, family: item.family, zone: item.zone, slot, days: [], category, tags: [...(item.tags ?? [])], query: item.query ?? null, hint: item.hint ?? null, carries: [], notes: [] };
      steps.set(id, s);
      if (!category) warnings.push({ kind: 'no-page', text: `${item.label}: this site has no ranked page for it yet, so the step is planned without a product pick.`, keys: [item.key] });
      if (item.zone !== 'face') warnings.push({ kind: 'zone', text: `${item.label} is placed on the ${item.zone} plan, not the face.`, keys: [item.key] });
    }
    return s;
  };

  const clashIn = (cell: Cell, item: CatalogItem): RuleHit | null => {
    for (const other of cell.steps) {
      if (other.zone !== item.zone) continue;
      const hit = rules.clash(item.family, other.family);
      if (hit) return hit;
    }
    return null;
  };

  const place = (item: CatalogItem, day: Day, slot: Slot) => {
    const step = ensureStep(item, slot);
    if (!step.days.includes(day)) step.days.push(day);
    const cell = grid[day][slot];
    if (!cell.steps.includes(step)) cell.steps.push(step);
  };

  // 1. Core (cleanse / moisturise) every day in both slots; sunscreen every morning.
  for (const { item } of real.filter(({ item }) => item.role === 'core' || item.role === 'protect')) {
    for (const slot of item.slots) for (const day of DAYS) place(item, day, slot);
  }

  // 2. Strong actives: one per night, spread out, rest nights kept free.
  //    Each zone (face / body …) has its own seven nights, so a body urea night never costs the face a night.
  const actives = real.filter(({ item }) => item.role === 'active').sort((a, b) => b.item.priority - a.item.priority);
  const restWanted = Math.max(opts.sensitive ? 2 : 0, Math.min(6, opts.restNights));
  if (opts.sensitive && actives.some(({ inv }) => inv.days > 2)) warnings.push({ kind: 'skin', text: 'Sensitive skin: each active is capped at 2 nights a week and at least 2 nights are left free.', keys: actives.map(({ item }) => item.key) });
  let restNights: Day[] = [...DAYS];
  const restLabel = `${restWanted} rest night${restWanted === 1 ? '' : 's'}`;
  for (const zone of [...new Set(actives.map(({ item }) => item.zone))]) {
    const wanted = actives.filter(({ item }) => item.zone === zone).map(({ inv, item }) => ({ item, nights: Math.min(inv.days, opts.sensitive ? 2 : 7), asked: inv.days }));
    const floor = (w: { item: CatalogItem }) => (w.item.key === 'retinol' ? 2 : 1);
    const available = 7 - restWanted;
    let total = wanted.reduce((n, w) => n + w.nights, 0);
    // Trim the lowest-priority items first, down to a floor; only then drop whole items, lowest priority first.
    while (total > available) {
      const victim = [...wanted].reverse().find((w) => w.nights > floor(w)) ?? [...wanted].reverse().find((w) => w.nights > 0);
      if (!victim) break;
      victim.nights -= 1;
      total -= 1;
    }
    for (const w of wanted) {
      if (w.nights === w.asked) continue;
      warnings.push(w.nights === 0
        ? { kind: 'unplaced', text: `${w.item.label}: no night left once the higher-priority actives and ${restLabel} are placed — one exfoliant or retinoid per night. Drop something, lower the rest nights, or remove it.`, keys: [w.item.key] }
        : { kind: 'reduced', text: `${w.item.label}: ${w.nights} night${w.nights === 1 ? '' : 's'} a week instead of ${w.asked} — one exfoliant or retinoid per night, ${restLabel} kept.`, keys: [w.item.key] });
    }
    const freeNights = DAYS.map((_, i) => i);
    for (const w of wanted) {
      if (!w.nights) continue;
      const nights = spread(w.nights, freeNights);
      for (const n of nights) { freeNights.splice(freeNights.indexOf(n), 1); place(w.item, DAYS[n], 'pm'); }
    }
    if (zone === 'face') restNights = freeNights.map((n) => DAYS[n]);
  }
  const families = [...new Set(real.map(({ item }) => item.family).filter((f): f is string => f !== null))];
  for (let i = 0; i < families.length; i++) for (let j = i; j < families.length; j++) {
    const hit = rules.lookup(families[i], families[j]);
    if (hit && (i !== j || hit.verdict !== 'fine')) rulesUsed.set(hit.pair.join('|'), hit);
  }
  if (actives.some(({ item }) => item.zone === 'face') && restNights.length === 0) warnings.push({ kind: 'rest', text: 'Every night carries an active — no recovery night. Raise the rest nights or drop one active.', keys: [] });

  // 3. Daily hydration layers in their preferred slot.
  for (const { item } of real.filter(({ item }) => item.role === 'hydrate')) for (const day of DAYS) place(item, day, item.slots[0]);

  // 4. Gentle actives: fill slots under the layer cap, never next to a flagged pairing.
  const treats = real.filter(({ item }) => item.role === 'treat').sort((a, b) => b.item.priority - a.item.priority);
  const treatCount = (cell: Cell) => cell.steps.filter((s) => s.role === 'treat' || s.role === 'active').length;
  for (const { inv, item } of treats) {
    const options: { day: Day; slot: Slot; load: number }[] = [];
    for (const slot of item.slots) {
      for (const day of DAYS) {
        const cell = grid[day][slot];
        const hit = clashIn(cell, item);
        if (hit) { rulesUsed.set(hit.pair.join('|'), hit); continue; }
        if (treatCount(cell) >= TREAT_CAP[slot]) continue;
        options.push({ day, slot, load: treatCount(cell) + (slot === item.slots[0] ? 0 : 1) });
      }
    }
    const perDay = new Map<Day, { day: Day; slot: Slot; load: number }>();
    for (const o of options) { const cur = perDay.get(o.day); if (!cur || o.load < cur.load) perDay.set(o.day, o); }
    const dayOptions = DAYS.map((d, i) => ({ i, o: perDay.get(d) })).filter((x): x is { i: number; o: { day: Day; slot: Slot; load: number } } => x.o !== undefined);
    const want = Math.min(inv.days, dayOptions.length);
    const chosen = want === dayOptions.length ? dayOptions : spread(want, dayOptions.map((x) => x.i)).map((i) => dayOptions.find((x) => x.i === i)!);
    for (const { o } of chosen) { place(item, o.day, o.slot); if (o.slot !== item.slots[0]) ensureStep(item, o.slot).notes.push(`${DAY_LABEL[o.day]}: moved to the ${o.slot === 'am' ? 'morning' : 'night'} — the preferred slot was full or clashed.`); }
    if (want < inv.days) warnings.push({ kind: want === 0 ? 'unplaced' : 'reduced', text: `${item.label}: ${want} day${want === 1 ? '' : 's'} instead of ${inv.days} — the other slots were full or clashed with an active.`, keys: [item.key] });
  }

  // 5. Ingredients that live inside products ride on the moisturiser or a barrier serum.
  if (carried.length) {
    const barrier = carried.filter(({ item }) => item.categories[0] === 'calmserum');
    const inMoist = carried.filter(({ item }) => item.categories[0] !== 'calmserum');
    const attach = (target: PlanStep | undefined, list: typeof carried) => {
      if (!target) return false;
      for (const { item } of list) { target.carries.push(item.label); target.tags.push(...(item.tags ?? [])); }
      target.tags = [...new Set(target.tags)];
      return true;
    };
    const moist = steps.get(stepId('moisturise', 'pm')) ?? steps.get(stepId('moisturise', 'am'));
    if (inMoist.length && !attach(moist, inMoist)) {
      const m = catalogItem('moisturise');
      for (const day of DAYS) place(m, day, 'pm');
      attach(steps.get(stepId('moisturise', 'pm')), inMoist);
      warnings.push({ kind: 'layers', text: `A night moisturiser was added to carry ${inMoist.map(({ item }) => item.label).join(', ')}.`, keys: inMoist.map(({ item }) => item.key) });
    }
    if (barrier.length) {
      let target = steps.get(stepId('barrier', 'pm')) ?? steps.get(stepId('barrier', 'am'));
      if (!target) {
        const b = catalogItem('barrier');
        for (const day of DAYS) place(b, day, 'pm');
        target = steps.get(stepId('barrier', 'pm'));
        warnings.push({ kind: 'layers', text: `A barrier / soothing serum step was added to carry ${barrier.map(({ item }) => item.label).join(', ')} — one product, not ${barrier.length} separate ones.`, keys: barrier.map(({ item }) => item.key) });
      }
      attach(target, barrier);
    }
  }

  // 6. Order within a slot: cleanse → hydrate → treat → active → moisturise/sunscreen last.
  const rank = (s: PlanStep) => (s.key === 'moisturise' ? 3.5 : s.key === 'cleanse' ? -1 : ROLE_ORDER[s.role]);
  const cells = Object.fromEntries(DAYS.map((d) => [d, {
    am: [...grid[d].am.steps].sort((a, b) => rank(a) - rank(b)).map((s) => s.id),
    pm: [...grid[d].pm.steps].sort((a, b) => rank(a) - rank(b)).map((s) => s.id),
  }])) as WeekPlan['cells'];

  const ordered = [...steps.values()].map((s) => ({ ...s, days: DAYS.filter((d) => s.days.includes(d)) })).filter((s) => s.days.length > 0)
    .sort((a, b) => (a.slot === b.slot ? rank(a) - rank(b) : a.slot === 'am' ? -1 : 1));
  return { steps: ordered, warnings, restNights, cells, rulesUsed: [...rulesUsed.values()] };
}
