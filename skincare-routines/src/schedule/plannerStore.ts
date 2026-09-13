/** Progressive routine builder state (State pattern over the stages). Stages run in order and each one's output stays
 * on screen while the next runs: inventory → pairing rules → week → products → Gemini review → proposals. Only the review
 * stage calls the model, and it is optional — the plan and every pick come from the site's own data, so a failed or
 * unconfigured assistant leaves a complete, honestly-labelled plan behind. */
import { useSyncExternalStore } from 'react';
import { chatConfig } from '../chat/config';
import { LedgerStore } from '../chat/local/store';
import { getPage } from '../chat/pageContext';
import { transportFor } from '../chat/transport';
import type { ChatError, ChatEvent } from '../chat/types';
import { newId, type Proposal, type Setup } from './model';
import { catalogItem, parseInventory, type Inventory } from './planner/inventory';
import { pickForStep, type PickResult } from './planner/picker';
import { REVIEW_TOOL, reviewFrom, reviewMessage, type Review } from './planner/review';
import { PairingRules } from './planner/rules';
import { buildWeekPlan, type PlanStep, type WeekPlan } from './planner/scheduler';
import { addProposals } from './scheduleStore';

export type StageId = 'inventory' | 'rules' | 'week' | 'products' | 'review';
export type StageStatus = 'pending' | 'running' | 'done' | 'skipped' | 'error';
export interface Stage { id: StageId; label: string; status: StageStatus; detail: string }

export interface PlannerState {
  input: string;
  restNights: number;
  inventory: Inventory | null;
  week: WeekPlan | null;
  picks: Record<string, PickResult>;
  /** products stage progress: how many steps have a pick result so far. */
  picked: number;
  review: Review | null;
  reviewNote: string;
  reviewError: ChatError | null;
  stages: Stage[];
  phase: 'idle' | 'running' | 'built' | 'error';
  error: string | null;
  /** Step ids already sent to the routine as proposals in this build. */
  proposed: Set<string>;
  batch: string | null;
}

const KEY = 'ledger.planner.v1';
const STAGES: { id: StageId; label: string }[] = [
  { id: 'inventory', label: 'Reading what you have' },
  { id: 'rules', label: 'Loading pairing evidence' },
  { id: 'week', label: 'Spreading actives across the week' },
  { id: 'products', label: 'Finding ranked listings' },
  { id: 'review', label: 'Assistant second opinion' },
];
const catalogZone = (key: string) => catalogItem(key).zone;
const freshStages = (): Stage[] => STAGES.map((s) => ({ ...s, status: 'pending', detail: '' }));

function restore(): { input: string; restNights: number } {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as unknown;
    if (typeof raw === 'object' && raw !== null) {
      const r = raw as Record<string, unknown>;
      return { input: typeof r.input === 'string' ? r.input : '', restNights: typeof r.restNights === 'number' ? Math.max(0, Math.min(6, r.restNights)) : 1 };
    }
  } catch { /* corrupt or unavailable storage → defaults */ }
  return { input: '', restNights: 1 };
}

let state: PlannerState = {
  ...restore(), inventory: null, week: null, picks: {}, picked: 0, review: null, reviewNote: '', reviewError: null,
  stages: freshStages(), phase: 'idle', error: null, proposed: new Set(), batch: null,
};
let controller: AbortController | null = null;
let labelFor: (id: string) => string = (id) => id;
let categoryIds: ReadonlySet<string> = new Set();
const store = new LedgerStore();
const listeners = new Set<() => void>();

function set(patch: Partial<PlannerState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
function stage(id: StageId, status: StageStatus, detail = '') {
  set({ stages: state.stages.map((s) => (s.id === id ? { ...s, status, detail } : s)) });
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify({ input: state.input, restNights: state.restNights })); } catch { /* private mode / quota: input lives for the tab only */ }
}

/** The page registers the manifest-derived bits once loaded (labels, which category pages exist, canonical site URL). */
export function registerPlannerContext(ctx: { labelFor: (id: string) => string; categoryIds: Iterable<string> }) {
  labelFor = ctx.labelFor;
  categoryIds = new Set(ctx.categoryIds);
}

export const setPlannerInput = (input: string) => { set({ input }); persist(); };
export const setRestNights = (restNights: number) => { set({ restNights: Math.max(0, Math.min(6, restNights)) }); persist(); };

/** Live preview while typing: what the parser recognises and what it does not. */
export const previewInventory = (input: string): Inventory => parseInventory(input);

/** Aborts whatever is running; what was already built stays, and the interrupted stage says so. */
export function stopPlanner() {
  if (!controller) return;
  controller.abort();
  controller = null;
  const running = state.stages.find((s) => s.status === 'running');
  if (running) stage(running.id, 'skipped', running.id === 'products' && state.week ? `Stopped at ${state.picked} / ${state.week.steps.length} — the rest can be picked by hand` : 'Stopped.');
  if (state.phase === 'running') set({ phase: state.week ? 'built' : 'idle' });
}

export function resetPlanner() {
  stopPlanner();
  set({ inventory: null, week: null, picks: {}, picked: 0, review: null, reviewNote: '', reviewError: null, stages: freshStages(), phase: 'idle', error: null, proposed: new Set(), batch: null });
}

/** Runs the deterministic stages, then the product picks, then (if the assistant is configured) the review. */
export async function buildPlan(setup: Setup) {
  if (state.phase === 'running') return;
  stopPlanner();
  const ctl = new AbortController();
  controller = ctl;
  const batch = newId();
  set({ inventory: null, week: null, picks: {}, picked: 0, review: null, reviewNote: '', reviewError: null, stages: freshStages(), phase: 'running', error: null, proposed: new Set(), batch });
  try {
    stage('inventory', 'running');
    const inventory = parseInventory(state.input);
    if (!inventory.items.length) {
      stage('inventory', 'error', 'Nothing recognised — name the products or ingredients you have (e.g. "retinol, glycolic 2x, sunscreen").');
      set({ inventory, phase: 'error', error: 'Nothing recognised in your list.' });
      return;
    }
    set({ inventory });
    stage('inventory', 'done', `${inventory.items.length} recognised${inventory.unknown.length ? `, ${inventory.unknown.length} not understood` : ''}`);

    stage('rules', 'running');
    let rules: PairingRules;
    try {
      const knowledge = await store.knowledge();
      rules = new PairingRules(knowledge.pairings);
      stage('rules', 'done', `${knowledge.pairings.length} sourced pairings`);
    } catch (err) {
      rules = new PairingRules([]);
      stage('rules', 'done', `Sourced pairings unavailable (${(err as Error).message}); built-in rules only`);
    }
    if (ctl.signal.aborted) return;

    stage('week', 'running');
    const zones = new Set(setup.zones);
    const items = inventory.items.filter((it) => zones.has(catalogZone(it.key)));
    const skipped = inventory.items.length - items.length;
    const week = buildWeekPlan(items, { restNights: state.restNights, sensitive: setup.skinType === 'sensitive', categories: categoryIds }, rules);
    set({ week });
    stage('week', 'done', `${week.steps.length} steps · ${week.restNights.length} rest night${week.restNights.length === 1 ? '' : 's'}${skipped ? ` · ${skipped} item${skipped === 1 ? '' : 's'} outside your chosen zones` : ''}${week.warnings.length ? ` · ${week.warnings.length} note${week.warnings.length === 1 ? '' : 's'}` : ''}`);

    stage('products', 'running', `0 / ${week.steps.length}`);
    const siteUrl = (await chatConfig()).siteUrl || window.location.origin;
    const picks: Record<string, PickResult> = {};
    let found = 0;
    for (const step of week.steps) {
      if (ctl.signal.aborted) return;
      const result = await pickForStep(step, { maxPriceInr: setup.maxPriceInr, skinType: setup.skinType }, store, siteUrl);
      picks[step.id] = result;
      if (result.chosen) found += 1;
      set({ picks: { ...picks }, picked: Object.keys(picks).length });
      stage('products', 'running', `${Object.keys(picks).length} / ${week.steps.length}`);
    }
    stage('products', 'done', `${found} of ${week.steps.length} steps have a ranked pick`);
    set({ phase: 'built' });

    await reviewWithAssistant(setup, ctl);
  } catch (err) {
    if (ctl.signal.aborted) return;
    set({ phase: 'error', error: (err as Error).message || 'The planner failed.' });
    const running = state.stages.find((s) => s.status === 'running');
    if (running) stage(running.id, 'error', (err as Error).message);
  } finally {
    if (controller === ctl) controller = null;
  }
}

/** Optional: one Gemini turn that reads the finished plan and answers through review_routine_plan. Failures never touch the plan. */
export async function reviewWithAssistant(setup: Setup, ctl: AbortController = new AbortController()) {
  const { week, picks } = state;
  if (!week) return;
  controller = ctl;
  set({ review: null, reviewNote: '', reviewError: null });
  stage('review', 'running', 'Sending the plan to the assistant…');
  const config = await chatConfig();
  if (config.mode === 'browser' && !config.gemini.apiKey) {
    stage('review', 'skipped', 'Assistant not configured on this deployment — the plan above is complete without it.');
    return;
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    stage('review', 'skipped', 'Offline — the plan is built from data on this device; reconnect for the assistant’s notes.');
    return;
  }
  let received = false;
  try {
    const transport = transportFor(config);
    const message = reviewMessage(week, picks, setup, labelFor);
    for await (const ev of transport({ message, history: [], page: getPage(), signal: ctl.signal })) {
      if (applyReview(ev, picks, week.warnings.map((w) => w.text))) received = true;
    }
    if (ctl.signal.aborted) { stage('review', 'skipped', 'Stopped.'); return; }
    if (received) stage('review', 'done', `${Object.keys(state.review?.notes ?? {}).length} step notes${state.review?.warnings.length ? ` · ${state.review.warnings.length} warning${state.review.warnings.length === 1 ? '' : 's'}` : ''}`);
    else stage('review', state.reviewError ? 'error' : 'skipped', state.reviewError?.message ?? 'The assistant answered without filing a review — its text is shown as-is; the plan stands on its own.');
  } catch (err) {
    if (ctl.signal.aborted) { stage('review', 'skipped', 'Stopped.'); return; }
    set({ reviewError: { message: (err as Error).message || 'Could not reach the assistant.', code: 'network' } });
    stage('review', 'error', (err as Error).message || 'Could not reach the assistant.');
  } finally {
    if (controller === ctl) controller = null;
  }
}

function applyReview(ev: ChatEvent, picks: Record<string, PickResult>, plannerWarnings: string[]): boolean {
  switch (ev.event) {
    case 'tool_call':
      stage('review', 'running', ev.data.name === REVIEW_TOOL ? 'Validating the assistant’s notes…' : 'Assistant is checking ingredient evidence…');
      return false;
    case 'tool_payload':
      if (ev.data.name !== REVIEW_TOOL) return false;
      set({ review: reviewFrom(ev.data.result, picks, plannerWarnings) });
      return true;
    case 'text':
      set({ reviewNote: state.reviewNote + (ev.data.delta ?? '') });
      return false;
    case 'error':
      set({ reviewError: ev.data });
      return false;
    default:
      return false;
  }
}

/** The listing a step will be proposed with: the assistant's validated swap if any, else the ranked pick. */
export function effectivePick(stepId: string): PickResult['chosen'] {
  const pick = state.picks[stepId];
  if (!pick) return null;
  const swap = state.review?.notes[stepId]?.pickId;
  return (swap && pick.candidates.find((c) => c.id === swap)) ?? pick.chosen;
}

/** Overrides the pick from the step's own candidate list (user choice in the UI). */
export function choosePick(stepId: string, productId: string) {
  const pick = state.picks[stepId];
  const chosen = pick?.candidates.find((c) => c.id === productId);
  if (!pick || !chosen) return;
  const review = state.review ? { ...state.review, notes: { ...state.review.notes, [stepId]: { why: state.review.notes[stepId]?.why ?? '', pickId: null } } } : null;
  set({ picks: { ...state.picks, [stepId]: { ...pick, chosen } }, review });
}

function proposalOf(step: PlanStep, batch: string): Proposal {
  const note = state.review?.notes[step.id]?.why ?? '';
  const carried = step.carries.length ? `Carries ${step.carries.join(', ')}.` : '';
  return {
    id: newId(), status: 'pending', createdAt: Date.now(), batch,
    why: note || [step.hint, carried, ...step.notes].filter(Boolean).join(' '),
    step: { slot: step.slot, zone: step.zone, title: step.label, days: [...step.days], category: step.category, product: effectivePick(step.id), note: carried },
  };
}

/** Sends chosen steps to the routine as PENDING proposals — the user still accepts each one there. */
export function proposeSteps(stepIds: string[]): number {
  const { week } = state;
  if (!week) return 0;
  const batch = state.batch ?? newId();
  const todo = week.steps.filter((s) => stepIds.includes(s.id) && !state.proposed.has(s.id));
  if (!todo.length) return 0;
  addProposals(todo.map((s) => proposalOf(s, batch)));
  set({ proposed: new Set([...state.proposed, ...todo.map((s) => s.id)]), batch });
  return todo.length;
}

export const proposeAll = () => proposeSteps(state.week?.steps.map((s) => s.id) ?? []);

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const usePlanner = (): PlannerState => useSyncExternalStore(subscribe, () => state, () => state);
