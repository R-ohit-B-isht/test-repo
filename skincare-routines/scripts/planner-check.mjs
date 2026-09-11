/** Regression checks for the deterministic routine planner (src/schedule/planner): parses the sample inventory, builds the
 * week and asserts the safety invariants — one strong active per night, flagged pairs never share a slot, sunscreen every
 * morning, rest nights honoured, nothing dropped silently. Bundles the TS with esbuild so it runs under plain node. */
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const out = join(root, 'node_modules', '.cache', 'planner-check.mjs');
await build({
  entryPoints: [join(root, 'src/schedule/planner/index.ts')],
  bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent',
});
const { parseInventory, buildWeekPlan, PairingRules, CATALOG } = await import(pathToFileURL(out).href);
const knowledge = JSON.parse(readFileSync(join(root, 'public/data/knowledge.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(root, 'public/data/manifest.json'), 'utf8'));
const categories = new Set(manifest.categories.map((c) => c.id));
const rules = new PairingRules(knowledge.pairings);

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.log('FAIL', msg); } };

const PROMPT = "Use all also make sure we are using right ingredients together in a schedule instead of throwing everything to night and daya category I'm okay using thing 2-3 days and other things for other days Face wash cleanser exfoliator toner essense serum retinol glycolic azelaic niacinamide salicylic moisturizer sunscreen vitamin c nad+ nmn pdrn txa  peptide ha hyaluronic acid glycerin  allatonin pantenol green tea ceramide betaine madecassoside ceramide squalane  eraser shot lactic acid benzoyl peroxide urea 20% Kojic acid";

const inv = parseInventory(PROMPT);
const keys = inv.items.map((i) => i.key);
const expect = ['cleanse', 'exfoliator', 'toner', 'essence', 'retinol', 'glycolic', 'azelaic', 'niacinamide', 'salicylic', 'moisturise', 'sunscreen', 'vitc', 'nadnmn', 'pdrn', 'txa', 'peptide', 'ha', 'glycerin', 'allantoin', 'panthenol', 'greentea', 'ceramide', 'betaine', 'madecassoside', 'squalane', 'erasershot', 'lactic', 'bpo', 'urea20', 'kojic'];
for (const k of expect) check(keys.includes(k), `inventory missing ${k}`);
check(inv.unknown.length === 0, `unexpected unknown tokens: ${inv.unknown.join(', ')}`);
console.log(`inventory: ${inv.items.length} items, unknown: [${inv.unknown.join(', ')}]`);

for (const [restNights, sensitive] of [[1, false], [0, false], [2, false], [1, true]]) {
  const plan = buildWeekPlan(inv.items, { restNights, sensitive, categories }, rules);
  const byId = new Map(plan.steps.map((s) => [s.id, s]));
  for (const day of Object.keys(plan.cells)) {
    for (const slot of ['am', 'pm']) {
      const steps = plan.cells[day][slot].map((id) => byId.get(id));
      const actives = steps.filter((s) => s.role === 'active' && s.zone === 'face');
      check(actives.length <= 1, `${day} ${slot}: ${actives.length} face actives (${actives.map((s) => s.key).join(', ')}) rest=${restNights}`);
      for (let i = 0; i < steps.length; i++) for (let j = i + 1; j < steps.length; j++) {
        if (steps[i].zone !== steps[j].zone) continue;
        const hit = rules.clash(steps[i].family, steps[j].family);
        check(!hit, `${day} ${slot}: ${steps[i].key} + ${steps[j].key} clash (${hit?.headline})`);
      }
      const treat = steps.filter((s) => s.role === 'treat' || s.role === 'active').length;
      check(treat <= 3, `${day} ${slot}: ${treat} treatment layers`);
    }
    check(plan.cells[day].am.includes('sunscreen:am'), `${day}: no sunscreen in the morning`);
    check(plan.cells[day].am.at(-1) === 'sunscreen:am', `${day}: sunscreen not last in AM`);
    check(plan.cells[day].am[0] === 'cleanse:am' && plan.cells[day].pm[0] === 'cleanse:pm', `${day}: cleanse not first`);
  }
  const faceActiveNights = Object.keys(plan.cells).filter((d) => plan.cells[d].pm.some((id) => byId.get(id).role === 'active' && byId.get(id).zone === 'face'));
  check(plan.restNights.length >= (sensitive ? 2 : restNights), `rest nights ${plan.restNights.length} < ${restNights}`);
  check(faceActiveNights.length + plan.restNights.length === 7, `active nights ${faceActiveNights.length} + rest ${plan.restNights.length} != 7`);
  const retinol = byId.get('retinol:pm');
  check(retinol && retinol.days.length >= 2 && retinol.days.length <= (sensitive ? 2 : 3), `retinol nights ${retinol?.days.length}`);
  check(byId.get('urea20:pm')?.zone === 'body', 'urea not on body');
  const placed = new Set(plan.steps.map((s) => s.key));
  const unplaced = plan.warnings.filter((w) => w.kind === 'unplaced').flatMap((w) => w.keys);
  for (const it of inv.items) {
    const cat = CATALOG.find((c) => c.key === it.key);
    if (cat.ingredientOnly) { check(plan.steps.some((s) => s.carries.includes(cat.label)), `${it.key} not carried by any step`); continue; }
    check(placed.has(it.key) || unplaced.includes(it.key), `${it.key} neither placed nor reported unplaced`);
  }
  console.log(`rest=${restNights} sensitive=${sensitive}: ${plan.steps.length} steps, active nights ${faceActiveNights.join(',')}, rest ${plan.restNights.join(',')}, warnings ${plan.warnings.length}`);
  if (restNights === 1 && !sensitive) {
    for (const d of Object.keys(plan.cells)) console.log(`  ${d} AM ${plan.cells[d].am.map((i) => i.split(':')[0]).join(' → ')}\n  ${d} PM ${plan.cells[d].pm.map((i) => i.split(':')[0]).join(' → ')}`);
    for (const w of plan.warnings) console.log('  !', w.kind, w.text);
    console.log('  rules:', plan.rulesUsed.map((r) => `${r.pair.join('+')}=${r.verdict}`).join(' '));
  }
}

// Small inventories
const small = parseInventory('cleanser, niacinamide, moisturizer, spf');
const p2 = buildWeekPlan(small.items, { restNights: 1, sensitive: false, categories }, rules);
check(p2.warnings.filter((w) => w.kind !== 'zone').length === 0, `small plan has warnings: ${p2.warnings.map((w) => w.text).join(' | ')}`);
check(p2.steps.find((s) => s.id === 'niacinamide:am')?.days.length === 7, 'niacinamide not daily');

const typo = parseInventory('retinol 2x, glycolic twice a week, essense, allatonin, pantenol, foobarbaz');
check(typo.items.find((i) => i.key === 'retinol')?.days === 2, 'retinol 2x not parsed');
check(typo.items.find((i) => i.key === 'glycolic')?.days === 2, 'glycolic twice not parsed');
check(typo.items.some((i) => i.key === 'essence') && typo.items.some((i) => i.key === 'allantoin') && typo.items.some((i) => i.key === 'panthenol'), 'typos not matched');
check(typo.unknown.includes('foobarbaz'), 'unknown token not reported');

console.log(fails ? `${fails} check(s) failed` : 'planner-check: all checks pass');
process.exit(fails ? 1 : 0);
