/** Regression checks for routine ordering (src/schedule + the edit_routine_steps tool): application-order layers, the
 * agent's `reorder` op end to end (tool → pending diff → accept / reject), invalid positions, stale targets, manual
 * up/down, and layer-aware placement of accepted AI steps. Bundles the TS with esbuild so it runs under plain node. */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const cache = join(root, 'node_modules', '.cache');
mkdirSync(cache, { recursive: true });
const entry = join(cache, 'routine-check.entry.ts');
writeFileSync(entry, [
  `export * as store from '${join(root, 'src/schedule/scheduleStore.ts')}';`,
  `export * as order from '${join(root, 'src/schedule/applicationOrder.ts')}';`,
  `export * as model from '${join(root, 'src/schedule/model.ts')}';`,
  `export { stepsForContext, editsFrom } from '${join(root, 'src/schedule/proposer.ts')}';`,
  `export { editRoutineSteps } from '${join(root, 'src/chat/local/tools/routineEdit.ts')}';`,
  `export { readRoutine } from '${join(root, 'src/chat/local/tools/routineRead.ts')}';`,
  `export * as rotation from '${join(root, 'src/schedule/rotation.ts')}';`,
  `export * as storage from '${join(root, 'src/schedule/storage.ts')}';`,
  `export { shelfFrom } from '${join(root, 'src/schedule/shelf.ts')}';`,
  `export * as owned from '${join(root, 'src/schedule/ownedStore.ts')}';`,
  `export * as remind from '${join(root, 'src/schedule/reminders/store.ts')}';`,
  `export * as payload from '${join(root, 'src/schedule/reminders/payload.ts')}';`,
  `export * as ics from '${join(root, 'src/schedule/reminders/ics.ts')}';`,
].join('\n'));
const out = join(cache, 'routine-check.mjs');
await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: out, logLevel: 'silent', define: { 'import.meta.env.BASE_URL': '"/"', 'import.meta.env.DEV': 'false' } });

const mem = new Map();
globalThis.localStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => { mem.set(k, v); }, removeItem: (k) => { mem.delete(k); } };
const { store, order, model, stepsForContext, editRoutineSteps, readRoutine, rotation, storage, shelfFrom, owned, remind, payload, ics } = await import(pathToFileURL(out).href);

let fails = 0;
const check = (ok, msg) => { if (!ok) { fails++; console.log('FAIL', msg); } };
const titles = (slot) => model.stepsFor(store.snapshot().plan.steps, slot, null).map((s) => s.title);
const DAILY = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const add = (slot, title, category) => store.addStep({ slot, days: DAILY, zone: 'face', title, category, product: null, note: '' });
const noIndex = { search: async () => ({ get: () => null }), categoryMeta: () => null };
const ctx = () => ({ store: noIndex, siteUrl: 'http://x', page: { routineSteps: stepsForContext(store.snapshot().plan.steps) } });
const reason = (res) => res.problems.flatMap((x) => x.reasons ?? []).join(' | ');
const pending = () => store.snapshot().plan.proposals.filter((p) => p.status === 'pending');

// 1. Application layers: category first, title fallback, unknown in the middle.
check(order.applicationLayer({ category: 'facewash', title: 'Anything' }) < order.applicationLayer({ category: 'toner', title: 'x' }), 'facewash < toner');
check(order.applicationLayer({ category: null, title: 'Sunscreen SPF 50' }) === 9, 'title fallback: sunscreen → 9');
check(order.applicationLayer({ category: null, title: 'Mystery' }) === 5.5, 'unknown title → neutral layer');
const sorted = order.byApplicationOrder([
  { category: 'sunscreen', title: 'Sunscreen' }, { category: 'moisturizer', title: 'Moisturiser' }, { category: 'toner', title: 'Toner' },
  { category: 'vitaminc', title: 'Vitamin C' }, { category: 'niacinamide', title: 'Niacinamide' }, { category: 'facewash', title: 'Cleanser' },
]).map((s) => s.title);
check(sorted.join() === 'Cleanser,Toner,Vitamin C,Niacinamide,Moisturiser,Sunscreen', `byApplicationOrder: ${sorted.join(' → ')} (serum tie keeps input order)`);
const sib = [{ category: 'facewash', title: 'Cleanser' }, { category: 'moisturizer', title: 'Moisturiser' }, { category: 'sunscreen', title: 'Sunscreen' }];
check(order.applicationPosition({ category: 'toner', title: 'Toner' }, sib) === 2, 'applicationPosition toner among cleanser/moist/spf → 2');
check(order.applicationPosition({ category: 'facewash', title: 'Balm' }, sib) === 2, 'equal layer goes after existing sibling');
check(order.applicationPosition({ category: 'heatprotect', title: 'x' }, sib) === 4, 'last layer → end');
check(order.applicationPosition({ category: 'cleansingbalm', title: 'x' }, sib) === 1, 'first layer → 1');

// 2. Store: a morning routine saved out of order (toner before cleanser, sunscreen in the middle).
store.clearPlan();
const toner = add('am', 'Toner', 'toner');
const cleanser = add('am', 'Cleanser', 'facewash');
const spf = add('am', 'Sunscreen', 'sunscreen');
const moist = add('am', 'Moisturiser', 'moisturizer');
const night = add('pm', 'Retinol', 'retinol');
check(titles('am').join() === 'Toner,Cleanser,Sunscreen,Moisturiser', `precondition AM order: ${titles('am').join(',')}`);
check(model.positionOf(store.snapshot().plan.steps, spf) === 3, 'positionOf sunscreen = 3');
const ctxSteps = stepsForContext(store.snapshot().plan.steps);
check(ctxSteps.find((s) => s.id === cleanser)?.position === 2 && ctxSteps.find((s) => s.id === night)?.position === 1, 'context positions are per slot');

// 3. Agent: "put cleanser before toner" → reorder position 1.
let res = await editRoutineSteps.run({ edits: [{ step_id: cleanser, op: 'reorder', position: 1, why: 'cleanse first' }] }, ctx());
check(res.edits.length === 1 && res.edits[0].after.position === 1 && res.problems.length === 0, `tool reorder ok: ${JSON.stringify(res)}`);
let n = store.receiveEdits(res, 'b1');
check(n === 1 && pending().length === 1, 'reorder lands as one pending proposal');
let p = pending()[0];
check(p.edit.op === 'reorder' && p.edit.position.from === 2 && p.edit.position.to === 1, `pending diff carries from/to: ${JSON.stringify(p.edit.position)}`);
check(titles('am').join() === 'Toner,Cleanser,Sunscreen,Moisturiser', 'nothing moved before accept');
check(p.step.title === 'Cleanser' && p.step.slot === 'am' && p.step.days.length === 7 && p.step.category === 'facewash', 'reorder keeps every other field');
store.rejectProposal(p.id);
check(titles('am').join() === 'Toner,Cleanser,Sunscreen,Moisturiser', 'reject leaves order alone');
store.receiveEdits(res, 'b2');
let r = store.acceptProposal(pending()[0].id);
check(r.applied && titles('am').join() === 'Cleanser,Toner,Sunscreen,Moisturiser', `accept applies: ${titles('am').join(',')}`);
check(store.snapshot().plan.steps.find((s) => s.id === cleanser).days.length === 7, 'accepted step keeps days');

// 4. "Make sunscreen last in the morning" → position = slot size.
res = await editRoutineSteps.run({ edits: [{ step_id: spf, op: 'reorder', position: 4, why: 'spf last' }] }, ctx());
store.receiveEdits(res, 'b3');
r = store.acceptProposal(pending()[0].id);
check(r.applied && titles('am').join() === 'Cleanser,Toner,Moisturiser,Sunscreen', `sunscreen last: ${titles('am').join(',')}`);
check(titles('pm').join() === 'Retinol', 'PM untouched');

// 5. Whole-slot re-sequence in one call (ascending positions, one already in place) → exact target order.
add('am', 'Vitamin C', 'vitaminc');
res = await editRoutineSteps.run({ edits: [
  { step_id: spf, op: 'reorder', position: 1, why: 'x' }, { step_id: moist, op: 'reorder', position: 2, why: 'x' },
  { step_id: toner, op: 'reorder', position: 3, why: 'x' }, { step_id: cleanser, op: 'reorder', position: 4, why: 'x' },
] }, ctx());
check(res.edits.length === 4 && res.problems.length === 0, `batch accepted: ${JSON.stringify(res.problems)}`);
store.receiveEdits(res, 'b4');
let all = store.acceptAllPending();
check(all.applied === 4 && titles('am').join() === 'Sunscreen,Moisturiser,Toner,Cleanser,Vitamin C', `batch order: ${titles('am').join(',')}`);
store.sortSlot('am');
check(titles('am').join() === 'Cleanser,Toner,Vitamin C,Moisturiser,Sunscreen', `sortSlot restores application order: ${titles('am').join(',')}`);

// 6. Invalid positions / missing / stale.
res = await editRoutineSteps.run({ edits: [{ step_id: spf, op: 'reorder', position: 9, why: 'x' }] }, ctx());
check(res.edits.length === 0 && /past the end/.test(reason(res)), `past-the-end refused: ${JSON.stringify(res.problems)}`);
res = await editRoutineSteps.run({ edits: [{ step_id: spf, op: 'reorder', position: 0, why: 'x' }] }, ctx());
check(res.edits.length === 0 && /whole number/.test(reason(res)), `zero refused: ${JSON.stringify(res.problems)}`);
res = await editRoutineSteps.run({ edits: [{ step_id: spf, op: 'reorder', position: 2.5, why: 'x' }] }, ctx());
check(res.edits.length === 0 && /whole number/.test(reason(res)), `fraction refused: ${JSON.stringify(res.problems)}`);
res = await editRoutineSteps.run({ edits: [{ step_id: spf, op: 'reorder', why: 'x' }] }, ctx());
check(res.edits.length === 0 && /needs position/.test(reason(res)), `missing position refused: ${JSON.stringify(res.problems)}`);
res = await editRoutineSteps.run({ edits: [{ step_id: spf, op: 'reorder', position: 5, why: 'x' }] }, ctx());
check(res.edits.length === 0 && /already #5/.test(reason(res)), `no-op alone refused: ${JSON.stringify(res.problems)}`);
res = await editRoutineSteps.run({ edits: [{ step_id: 'step_nope', op: 'reorder', position: 1, why: 'x' }] }, ctx());
check(res.edits.length === 0 && /no step with id/.test(reason(res)), `unknown id refused: ${JSON.stringify(res.problems)}`);
res = await editRoutineSteps.run({ edits: [{ step_id: night, op: 'move', slot: 'am', position: 1, why: 'x' }] }, ctx());
check(res.edits.length === 1 && res.edits[0].after.position === 1, 'move to other slot may pin a position there');
res = await editRoutineSteps.run({ edits: [{ step_id: night, op: 'move', slot: 'am', position: 7, why: 'x' }] }, ctx());
check(res.edits.length === 0 && /will have 6 steps/.test(reason(res)), `cross-slot position bounded by target slot: ${JSON.stringify(res.problems)}`);
// stale: proposal filed, then the step is removed before accept
res = await editRoutineSteps.run({ edits: [{ step_id: toner, op: 'reorder', position: 1, why: 'x' }] }, ctx());
store.receiveEdits(res, 'b5');
store.removeStep(toner);
r = store.acceptProposal(pending()[0].id);
check(!r.applied && /no longer/.test(r.reason ?? ''), `stale target refused on accept: ${JSON.stringify(r)}`);
check(titles('am').join() === 'Cleanser,Vitamin C,Moisturiser,Sunscreen', 'stale accept changed nothing');
// editsFrom drops a reorder that arrives without a position or for a step that vanished
check(store.receiveEdits({ edits: [{ step_id: cleanser, op: 'reorder', after: {}, why: 'x' }] }, 'b6') === 0, 'reorder without position never becomes a proposal');
check(store.receiveEdits({ edits: [{ step_id: 'gone', op: 'reorder', after: { position: 1 }, why: 'x' }] }, 'b7') === 0, 'unknown step never becomes a proposal');

// 7. Manual controls still work and clamp at the ends.
store.moveStep(spf, -1);
check(titles('am').join() === 'Cleanser,Vitamin C,Sunscreen,Moisturiser', `manual up: ${titles('am').join(',')}`);
store.moveStep(spf, 1);
store.moveStep(spf, 1);
check(titles('am').join() === 'Cleanser,Vitamin C,Moisturiser,Sunscreen', `manual down clamps: ${titles('am').join(',')}`);
store.moveStep(cleanser, -1);
check(titles('am')[0] === 'Cleanser', 'manual up clamps at 1');

// 8. Accepted AI steps slot in by application layer, not at the end.
store.receiveProposals({ steps: [{ title: 'Toner', slot: 'am', days: DAILY, zone: 'face', category: 'toner', product: null, why: 'x' }] }, 'b8');
store.acceptAllPending();
check(titles('am').join() === 'Cleanser,Toner,Vitamin C,Moisturiser,Sunscreen', `AI toner placed after cleanser: ${titles('am').join(',')}`);
store.receiveProposals({ steps: [{ title: 'Oil cleanser', slot: 'am', days: DAILY, zone: 'face', category: 'cleansingbalm', product: null, why: 'x' }] }, 'b9');
store.acceptAllPending();
check(titles('am')[0] === 'Oil cleanser', `AI balm goes first: ${titles('am').join(',')}`);
const persisted = JSON.parse(mem.get('ledger.routine.v1'));
const kept = persisted.proposals.find((x) => x.edit?.op === 'reorder' && x.edit.position);
check(kept && Number.isInteger(kept.edit.position.from) && Number.isInteger(kept.edit.position.to), 'reorder position survives storage');

// 9. Weekly rotation: deterministic on calendar Mondays, base = week 1, wraps for 2 and 3 options, reads as before without `rotation`.
const prod = (id, title) => ({ id, category: 'retinol', brand: 'B', title, url: 'http://x', price: 1, image: null, rank: 1, score: 1, inci: null });
const plain = { id: 'r1', slot: 'pm', days: DAILY, zone: 'face', title: 'Azelaic', category: 'azelaic', product: prod('p-az', 'Az 10%'), note: '', origin: 'user', order: 0 };
check(rotation.weekMonday(new Date(2026, 6, 19)).endsWith('-07-13') && rotation.weekMonday(new Date(2026, 6, 13)).endsWith('-07-13'), 'weekMonday: Sun 19 Jul and Mon 13 Jul → Mon 13 Jul');
check(rotation.shiftWeek('2026-07-13', 1) === '2026-07-20' && rotation.shiftWeek('2026-07-13', -1) === '2026-07-06', 'shiftWeek ±1');
const v0 = rotation.viewForWeek(plain, '2026-07-13');
check(v0.rotation === null && v0.now.title === 'Azelaic' && v0.now.product.id === 'p-az', 'step without rotation resolves to itself');
const two = { ...plain, rotation: { anchor: '2026-07-13', alternatives: [{ title: 'Retinol', category: 'retinol', product: prod('p-ret', 'Ret 0.3%'), note: '' }] } };
const w = (s, m) => rotation.viewForWeek(s, m);
check(w(two, '2026-07-13').now.title === 'Azelaic' && w(two, '2026-07-13').rotation.next.title === 'Retinol', '2-cycle: anchor week → base, next retinol');
check(w(two, '2026-07-20').now.title === 'Retinol' && w(two, '2026-07-27').now.title === 'Azelaic', '2-cycle: alternates week by week');
check(w(two, '2026-07-06').now.title === 'Retinol', '2-cycle: weeks before the anchor wrap, never negative');
const three = { ...two, rotation: { ...two.rotation, alternatives: [...two.rotation.alternatives, { title: 'Glycolic', category: 'glycolic', product: prod('p-gly', 'Gly 7%'), note: '' }] } };
check(['2026-07-13', '2026-07-20', '2026-07-27', '2026-08-03'].map((m) => w(three, m).now.title).join() === 'Azelaic,Retinol,Glycolic,Azelaic', '3-cycle wraps after week 3');
check(w(three, '2026-07-27').rotation.index === 2 && w(three, '2026-07-27').rotation.total === 3 && w(three, '2026-07-27').rotation.next.title === 'Azelaic', '3-cycle: week 3 of 3, next wraps to base');
check(w({ ...three, rotation: { ...three.rotation, anchor: rotation.anchorFor('2026-07-13', 2) } }, '2026-07-13').now.title === 'Glycolic', 'anchorFor makes option 3 this week');
check(storage.validRotation(undefined) === undefined && storage.validRotation({ anchor: 'nope', alternatives: [] }) === undefined && storage.validRotation({ anchor: '2026-07-13', alternatives: [{ title: 5 }] }) === undefined, 'malformed rotation reads as none');
check(storage.validRotation({ anchor: '2026-07-13', alternatives: three.rotation.alternatives }).alternatives.length === 2, 'well-formed rotation kept');
const ctxRows = stepsForContext([three], '2026-07-20');
check(ctxRows[0].title === 'Retinol' && ctxRows[0].product.id === 'p-ret' && ctxRows[0].rotation.active === 2 && ctxRows[0].rotation.options.map((o) => o.title).join() === 'Azelaic,Retinol,Glycolic', `chat context shows this week's option with the whole cycle: ${JSON.stringify(ctxRows[0].rotation)}`);
check(stepsForContext([plain], '2026-07-20')[0].rotation === null && stepsForContext([plain], '2026-07-20')[0].withMe === true, 'non-rotating step: no cycle, product with me by default');
check(stepsForContext([plain], '2026-07-20', new Set(['p-az']))[0].withMe === false && stepsForContext([{ ...plain, product: null }], '2026-07-20')[0].withMe === null, 'context withMe: false when on the missing set, null without a product');

// 10. Shelf lists every product in a cycle and says which is in use; ownership lives in its own key and never touches the plan.
const shelf = shelfFrom([three], '2026-07-20');
check(shelf.length === 3 && shelf.find((i) => i.product.id === 'p-ret').inUseNow && !shelf.find((i) => i.product.id === 'p-az').inUseNow, 'shelf: 3 products, retinol in use this week');
const planBefore = mem.get('ledger.routine.v1');
owned.setHave('p-az', false);
check(JSON.parse(mem.get('ledger.routine.owned.v1')).missing.join() === 'p-az', 'not-with-me id stored under ledger.routine.owned.v1');
check(mem.get('ledger.routine.v1') === planBefore, 'marking a product never rewrites the plan');
check(owned.isMissing(new Set(['p-az']), 'p-az') && !owned.isMissing(new Set(['p-az']), 'p-ret') && !owned.isMissing(new Set(['p-az']), null), 'isMissing: only listed ids, never null');
owned.setHave('p-az', true);
check(JSON.parse(mem.get('ledger.routine.owned.v1')).missing.length === 0, 'with me again → id removed');

// 11. Reminders: settings live in their own key, the push record names this week's rotation option per day, the .ics
// carries one alarmed weekly event per enabled slot on the routine's days — and none of it rewrites the plan.
const planBeforeRemind = mem.get('ledger.routine.v1');
check(remind.reminderSettings().slots.am.time === '07:30' && remind.reminderSettings().slots.pm.time === '21:30' && !remind.anyEnabled(remind.reminderSettings()), 'reminder defaults: 07:30 / 21:30, both off');
remind.setSlotEnabled('pm', true);
remind.setSlotTime('pm', '22:15');
remind.setSlotTime('pm', '25:99');
check(JSON.parse(mem.get('ledger.routine.reminders.v1')).slots.pm.time === '22:15', 'reminder time saved under ledger.routine.reminders.v1; invalid time ignored');
check(mem.get('ledger.routine.v1') === planBeforeRemind, 'reminder settings never rewrite the plan');
const weekdays = { ...three, days: ['mon', 'wed', 'fri'], slot: 'pm' };
const spfDaily = { ...plain, id: 'spf', title: 'Sunscreen', category: 'sunscreen', slot: 'am', days: DAILY, product: prod('p-spf', 'SPF 50'), rotation: undefined };
const sub = { endpoint: 'https://push.example/abc', keys: { p256dh: 'k'.repeat(20), auth: 'a'.repeat(12) }, expirationTime: null };
const rec = payload.reminderRecord([weekdays, spfDaily], remind.reminderSettings(), sub, new Date('2026-07-22T10:00:00'), 'Asia/Kolkata');
check(rec.weeks.length === 2 && rec.weeks[0].monday === '2026-07-20' && rec.weeks[1].monday === '2026-07-27', `record covers this week + next (${rec.weeks.map((w) => w.monday).join(', ')})`);
check(rec.weeks[0].days.mon.pm.join() === 'Retinol' && rec.weeks[1].days.mon.pm.join() === 'Glycolic', 'record names the rotation option live in each week');
check(rec.weeks[0].days.tue.pm.length === 0 && rec.weeks[0].days.tue.am.join() === 'Sunscreen', 'off-days carry no PM title; daily AM step present');
check(rec.tz === 'Asia/Kolkata' && rec.slots.pm.enabled && rec.slots.pm.time === '22:15' && !rec.slots.am.enabled && rec.url === '/#/routine', 'record carries tz, slot settings and the routine URL');
check(payload.recordHash(rec) === payload.recordHash(payload.reminderRecord([weekdays, spfDaily], remind.reminderSettings(), sub, new Date('2026-07-22T10:00:00'), 'Asia/Kolkata')), 'record hash is stable for an unchanged routine');
remind.setSlotTime('pm', '22:30');
check(payload.recordHash(rec) !== payload.recordHash(payload.reminderRecord([weekdays, spfDaily], remind.reminderSettings(), sub, new Date('2026-07-22T10:00:00'), 'Asia/Kolkata')), 'record hash moves when a time changes');
const cal = ics.buildIcs([weekdays, spfDaily], remind.reminderSettings(), new Date('2026-07-22T10:00:00'), 'Asia/Kolkata');
check((cal.match(/BEGIN:VEVENT/g) ?? []).length === 1 && /RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR/.test(cal) && /DTSTART:20260722T223000/.test(cal) && /BEGIN:VALARM[\s\S]*TRIGGER:PT0S/.test(cal), 'ics: one alarmed weekly event on Mon/Wed/Fri at 22:30 for the enabled slot');
remind.setSlotEnabled('am', true);
remind.setOnlyRoutineDays(false);
const cal2 = ics.buildIcs([weekdays, spfDaily], remind.reminderSettings(), new Date('2026-07-22T10:00:00'));
check((cal2.match(/BEGIN:VEVENT/g) ?? []).length === 2 && /BYDAY=MO,TU,WE,TH,FR,SA,SU/.test(cal2) && /SUMMARY:Morning skincare routine/.test(cal2) && cal2.split('\r\n').every((l) => l.length <= 75), 'ics: two events, every day when the day filter is off, lines folded ≤ 75');
check(ics.icsText('a, b; c\\d\nline') === 'a\\, b\\; c\\\\d line', 'ics escaping');
check(mem.get('ledger.routine.v1') === planBeforeRemind, 'building the record / calendar never rewrites the plan');

// 12. Assistant shelf + rotation ops end to end: tool → pending diff → accept / reject, on a saved routine, with a real-id index.
const HITS = {
  'p-az': { id: 'p-az', category: 'azelaic', brand: 'Minimalist', title: 'Azelaic 10%', score: 80, rank: 1, price: 600, store: 'Flipkart', inci: 'full', inciSource: 'brand-site' },
  'p-ret': { id: 'p-ret', category: 'retinol', brand: 'Minimalist', title: 'Retinol 0.3%', score: 78, rank: 2, price: 700, store: 'Amazon', inci: 'full', inciSource: null },
  'p-gly': { id: 'p-gly', category: 'glycolic', brand: 'Deconstruct', title: 'Glycolic 7%', score: 70, rank: 4, price: 500, store: 'Brand store', inci: 'full', inciSource: 'brand-site' },
  'p-spf': { id: 'p-spf', category: 'sunscreen', brand: 'Re\u2019equil', title: 'SPF 50', score: 90, rank: 1, price: 800, store: 'Flipkart', inci: 'full', inciSource: null },
};
const idx = { search: async () => ({ get: (id) => HITS[id] ?? null }), categoryMeta: (id) => ({ id, label: id[0].toUpperCase() + id.slice(1), count: 100 }) };
const MONDAY = rotation.weekMonday(new Date());
const ctxI = () => ({ store: idx, siteUrl: 'http://x', page: { routineSteps: stepsForContext(store.snapshot().plan.steps, MONDAY, owned.missingNow()) } });
const stepProd = (id) => ({ ...HITS[id], of: 100, priceInr: HITS[id].price, inciStatus: 'full', inciSourceKind: null, url: 'http://x' });
store.clearPlan();
const serum = store.addStep({ slot: 'pm', days: DAILY, zone: 'face', title: 'Azelaic', category: 'azelaic', product: stepProd('p-az'), note: 'thin layer' });
const sun = store.addStep({ slot: 'am', days: DAILY, zone: 'face', title: 'Sunscreen', category: 'sunscreen', product: stepProd('p-spf'), note: '' });
const bare = store.addStep({ slot: 'am', days: DAILY, zone: 'face', title: 'Cleanser', category: 'facewash', product: null, note: '' });
const saved = () => store.snapshot().plan.steps.find((s) => s.id === serum);
const missingNow = () => JSON.parse(mem.get('ledger.routine.owned.v1') ?? '{"missing":[]}').missing;

// owned: "I ran out of the sunscreen" → pending → nothing changes → reject / accept
res = await editRoutineSteps.run({ edits: [{ step_id: sun, op: 'owned', have: false, why: 'ran out' }] }, ctxI());
check(res.edits.length === 1 && res.edits[0].after.owned === false && res.edits[0].before.withMe === true, `owned tool ok: ${JSON.stringify(res.problems)}`);
check(store.receiveEdits(res, 'o1') === 1 && pending()[0].edit.op === 'owned' && pending()[0].edit.owned.productId === 'p-spf' && pending()[0].edit.owned.have === false, 'owned lands as a pending shelf proposal naming the product');
check(model.editVerb(pending()[0].edit) === 'Mark not with me', 'owned verb reads the direction');
let planSnap = mem.get('ledger.routine.v1');
check(missingNow().length === 0, 'owned: nothing on the shelf changes before accept');
store.rejectProposal(pending()[0].id);
check(missingNow().length === 0, 'owned: reject leaves the shelf alone');
store.receiveEdits(res, 'o2');
r = store.acceptProposal(pending()[0].id);
check(r.applied && missingNow().join() === 'p-spf', 'owned: accept marks the product not with me (ledger.routine.owned.v1)');
check(JSON.parse(mem.get('ledger.routine.v1')).steps.length === 3 && JSON.stringify(JSON.parse(mem.get('ledger.routine.v1')).steps) === JSON.stringify(JSON.parse(planSnap).steps), 'owned: accept never rewrites the saved steps');
check(ctxI().page.routineSteps.find((s) => s.id === sun).withMe === false, 'context now reads the sunscreen as not with me');
res = await editRoutineSteps.run({ edits: [{ step_id: sun, op: 'owned', have: false, why: 'x' }] }, ctxI());
check(res.edits.length === 0 && /already marked not with me/.test(reason(res)), `owned: same state refused: ${reason(res)}`);
res = await editRoutineSteps.run({ edits: [{ step_id: bare, op: 'owned', have: true, why: 'x' }] }, ctxI());
check(res.edits.length === 0 && /no product pinned/.test(reason(res)), 'owned: productless step refused');
res = await editRoutineSteps.run({ edits: [{ step_id: sun, op: 'owned', why: 'x' }] }, ctxI());
check(res.edits.length === 0 && /needs have/.test(reason(res)), 'owned: missing have refused');
res = await editRoutineSteps.run({ edits: [{ step_id: sun, op: 'owned', have: true, why: 'bought it' }] }, ctxI());
store.receiveEdits(res, 'o3');
store.updateStep(sun, { product: stepProd('p-gly') });
r = store.acceptProposal(pending()[0].id);
check(!r.applied && /no longer uses/.test(r.reason) && missingNow().join() === 'p-spf', 'owned: stale (product swapped meanwhile) refused on accept, shelf untouched');
owned.setHave('p-spf', true);
store.updateStep(sun, { product: stepProd('p-spf') });

// rotate: 3-option cycle, option 1 = current product, active = 2 this week
res = await editRoutineSteps.run({ edits: [{ step_id: serum, op: 'rotate', active: 2, why: 'alternate actives', options: [
  'Azelaic = current', 'Retinol = p-ret', 'Glycolic = p-gly',
] }] }, ctxI());
check(res.edits.length === 1 && res.edits[0].after.rotation.options.length === 3 && res.edits[0].after.rotation.options[0].product.id === 'p-az' && res.edits[0].after.rotation.active === 2, `rotate tool ok: ${JSON.stringify(res.problems)}`);
check(res.edits[0].after.rotation.options[1].product.brand === 'Minimalist' && res.edits[0].after.rotation.options[2].category === 'glycolic', 'rotate: options carry real listing snapshots');
check(store.receiveEdits(res, 'r1') === 1 && pending()[0].edit.op === 'rotate' && pending()[0].edit.before.rotation === undefined && pending()[0].step.rotation.alternatives.length === 2, 'rotate lands as pending with before (no cycle) → after (2 alternatives)');
check(pending()[0].step.title === 'Azelaic' && pending()[0].step.product.id === 'p-az' && pending()[0].step.note === 'thin layer' && rotation.viewForWeek(pending()[0].step, MONDAY).now.title === 'Retinol', 'rotate: option 1 is the step itself (note kept), option 2 on this week');
check(saved().rotation === undefined, 'rotate: nothing changes before accept');
r = store.acceptProposal(pending()[0].id);
check(r.applied && saved().rotation.alternatives.length === 2 && saved().days.length === 7 && saved().slot === 'pm' && saved().zone === 'face', 'rotate: accept installs the cycle, unrelated fields intact');
let view = rotation.viewForWeek(saved(), MONDAY);
check(view.now.title === 'Retinol' && view.rotation.next.title === 'Glycolic' && rotation.viewForWeek(saved(), rotation.shiftWeek(MONDAY, 2)).now.title === 'Azelaic', 'rotate: this week retinol, next glycolic, then back to azelaic');
let c = ctxI().page.routineSteps.find((s) => s.id === serum);
check(c.title === 'Retinol' && c.product.id === 'p-ret' && c.rotation.active === 2 && c.rotation.options.length === 3, 'context after accept: this week retinol, cycle of 3');

// rotate with just active: "make glycolic this week"
res = await editRoutineSteps.run({ edits: [{ step_id: serum, op: 'rotate', active: 3, why: 'glycolic now' }] }, ctxI());
check(res.edits.length === 1 && res.edits[0].after.rotation.active === 3 && res.edits[0].after.rotation.options === undefined, 'rotate active-only accepted');
store.receiveEdits(res, 'r2');
check(pending()[0].step.rotation.alternatives.length === 2 && rotation.viewForWeek(pending()[0].step, MONDAY).now.title === 'Glycolic', 'active-only keeps the cycle, moves the anchor');
store.acceptProposal(pending()[0].id);
check(rotation.viewForWeek(saved(), MONDAY).now.title === 'Glycolic' && saved().rotation.alternatives.length === 2, 'active-only accept: glycolic this week, cycle intact');
res = await editRoutineSteps.run({ edits: [{ step_id: serum, op: 'rotate', active: 3, why: 'x' }] }, ctxI());
check(res.edits.length === 0 && /already the one on this week/.test(reason(res)), 'rotate: same active refused');
res = await editRoutineSteps.run({ edits: [{ step_id: serum, op: 'rotate', active: 4, why: 'x' }] }, ctxI());
check(res.edits.length === 0 && /from 1 to 3/.test(reason(res)), 'rotate: active out of range refused');

// plain edits on a rotating step leave the cycle alone
res = await editRoutineSteps.run({ edits: [{ step_id: serum, op: 'move', days: 'mon,thu', why: 'x' }] }, ctxI());
store.receiveEdits(res, 'r3');
store.acceptProposal(pending()[0].id);
check(saved().days.join() === 'mon,thu' && saved().rotation.alternatives.length === 2 && rotation.viewForWeek(saved(), MONDAY).now.title === 'Glycolic', 'move on a rotating step keeps the cycle and this week\u2019s option');

// invalid cycles
res = await editRoutineSteps.run({ edits: [{ step_id: serum, op: 'rotate', options: ['Only = p-ret'], why: 'x' }] }, ctxI());
check(res.edits.length === 0 && /at least 2 options/.test(reason(res)), 'rotate: one option refused');
res = await editRoutineSteps.run({ edits: [{ step_id: serum, op: 'rotate', options: ['A = p-ret', 'B = p-nope'], why: 'x' }] }, ctxI());
check(res.edits.length === 0 && /no listing with id 'p-nope'/.test(reason(res)), 'rotate: invented product id refused');
res = await editRoutineSteps.run({ edits: [{ step_id: serum, op: 'rotate', options: ['A = p-ret', 'B = p-ret'], why: 'x' }] }, ctxI());
check(res.edits.length === 0 && /already another option/.test(reason(res)), 'rotate: same listing twice refused');
res = await editRoutineSteps.run({ edits: [{ step_id: serum, op: 'rotate', options: Array.from({ length: 7 }, (_, i) => `O${i} = none`), why: 'x' }] }, ctxI());
check(res.edits.length === 0 && /at most 6 options/.test(reason(res)), 'rotate: 7 options refused');
res = await editRoutineSteps.run({ edits: [{ step_id: bare, op: 'rotate', active: 2, why: 'x' }] }, ctxI());
check(res.edits.length === 0 && /needs options/.test(reason(res)), 'rotate: active-only on a non-rotating step refused');
res = await editRoutineSteps.run({ edits: [{ step_id: bare, op: 'stop_rotation', why: 'x' }] }, ctxI());
check(res.edits.length === 0 && /does not rotate/.test(reason(res)), 'stop_rotation on a plain step refused');
check(store.receiveEdits({ edits: [{ step_id: serum, op: 'rotate', after: { rotation: { options: [{ title: 'x' }], active: 1 } }, why: 'x' }] }, 'r4') === 0, 'editsFrom drops a one-option cycle');
check(store.receiveEdits({ edits: [{ step_id: 'gone', op: 'rotate', after: { rotation: { active: 2 } }, why: 'x' }] }, 'r5') === 0, 'editsFrom drops a rotate for a vanished step');

// productless option + a 2-cycle re-sent with an option removed (reorder / remove = resend the cycle)
res = await editRoutineSteps.run({ edits: [{ step_id: serum, op: 'rotate', options: ['Retinol = p-ret', 'Rest week = none'], why: 'x' }] }, ctxI());
check(res.edits.length === 1 && res.edits[0].after.rotation.options[1].product === null, 'rotate: 2-cycle with a productless week accepted');
store.receiveEdits(res, 'r6');
store.acceptProposal(pending()[0].id);
check(saved().title === 'Retinol' && saved().product.id === 'p-ret' && saved().rotation.alternatives.length === 1 && saved().rotation.alternatives[0].product === null && rotation.viewForWeek(saved(), MONDAY).now.title === 'Retinol', 'rotate: resent cycle replaces the old one, option 1 this week');

// stop_rotation keeping option 2, then stale on accept
res = await editRoutineSteps.run({ edits: [{ step_id: serum, op: 'stop_rotation', active: 2, why: 'x' }] }, ctxI());
check(res.edits.length === 1 && res.edits[0].after.rotation.active === 2, 'stop_rotation tool ok');
store.receiveEdits(res, 's1');
check(pending()[0].edit.op === 'stop_rotation' && pending()[0].edit.before.rotation.alternatives.length === 1 && pending()[0].step.rotation === undefined && pending()[0].step.title === 'Rest week', 'stop lands as before (cycle) → after (option 2 only)');
check(saved().rotation.alternatives.length === 1, 'stop: nothing changes before accept');
store.acceptProposal(pending()[0].id);
check(saved().rotation === undefined && saved().title === 'Rest week' && saved().product === null && saved().days.join() === 'mon,thu', 'stop: accept keeps option 2 as the step, days intact');
res = await editRoutineSteps.run({ edits: [{ step_id: sun, op: 'rotate', options: ['SPF = current', 'Glycolic = p-gly'], why: 'x' }] }, ctxI());
store.receiveEdits(res, 's2');
store.removeStep(sun);
r = store.acceptProposal(pending()[0].id);
check(!r.applied && /no longer/.test(r.reason), 'rotate: stale step refused on accept');
// read_routine: exact shelf / rotation / reminder reads, read-only
{
  const planBefore = JSON.stringify(store.snapshot().plan);
  const missingId = 'p-spf';
  const rows = stepsForContext([
    { ...spfDaily, id: 'r-spf' },
    { ...plain, id: 'r-rot', title: 'Azelaic', slot: 'pm', days: ['mon', 'thu'], product: prod('p-az', 'Azelaic 10%'), rotation: { anchor: MONDAY, alternatives: [{ title: 'Retinol', category: 'retinol', product: prod('p-ret', 'Retinol 0.3%'), note: '' }, { title: 'Glycolic', category: 'glycolic', product: prod('p-gly', 'Glycolic 8%'), note: '' }] } },
  ], MONDAY, new Set([missingId]));
  const rotRow = rows.find((x) => x.rotation);
  const ctxR = { store: idx, siteUrl: 'http://x', page: { routineSteps: rows, routineReminders: { am: { enabled: false, time: '07:30' }, pm: { enabled: true, time: '21:30' } } } };
  const out = await readRoutine.run({}, ctxR);
  check(out.steps === rows.length && out.not_with_me.length === 1 && out.not_with_me[0].product.id === missingId && out.reminders.pm.time === '21:30', 'read_routine: not_with_me + reminders exact');
  const rot = out.list.find((x) => x.rotation);
  check(rotRow && rot && rot.rotation.active === 1 && rot.rotation.next_week === 2 && rot.rotation.options.map((o) => o.option).join() === '1,2,3' && rot.rotation.options[2].product.id === 'p-gly', 'read_routine: rotation options numbered, next_week follows active');
  const am = await readRoutine.run({ slot: 'AM' }, ctxR);
  check(am.list.every((x) => x.slot === 'am') && am.steps === rows.filter((x) => x.slot === 'am').length, 'read_routine: slot filter');
  let threw = false;
  try { await readRoutine.run({ slot: 'noon' }, ctxR); } catch { threw = true; }
  check(threw, 'read_routine: bad slot refused');
  threw = false;
  try { await readRoutine.run({}, { store: idx, siteUrl: 'http://x', page: null }); } catch { threw = true; }
  check(threw, 'read_routine: no routine on page refused');
  check(JSON.stringify(store.snapshot().plan) === planBefore, 'read_routine: changes nothing');
}
const persistedEdits = JSON.parse(mem.get('ledger.routine.v1')).proposals.filter((x) => x.edit && ['owned', 'rotate', 'stop_rotation'].includes(x.edit.op));
check(persistedEdits.length >= 6 && persistedEdits.some((x) => x.edit.op === 'owned' && x.edit.owned.productId === 'p-spf') && persistedEdits.some((x) => x.edit.op === 'stop_rotation' && x.edit.before.rotation), 'owned / rotate / stop proposals survive storage with their before state');

console.log(fails ? `${fails} check(s) failed` : 'routine-check: all checks passed');
process.exit(fails ? 1 : 0);
