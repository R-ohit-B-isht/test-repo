/** "My routine" state: the plan (setup, accepted steps, AI proposals) persisted locally, plus the one-at-a-time Gemini
 * fill run. Proposals only ever enter as `pending`; the user moves them to a step (accept / edit) or rejects them. */
import { useSyncExternalStore } from 'react';
import { chatConfig } from '../chat/config';
import { getPage } from '../chat/pageContext';
import { transportFor } from '../chat/transport';
import type { ChatEvent, ChatError } from '../chat/types';
import { EMPTY_PLAN, newId, type Plan, type Proposal, type Setup, type Step } from './model';
import { fillMessage, NUDGE_MESSAGE, PROPOSE_TOOL, problemsFrom, proposalsFrom, toolStatus, type FillScope } from './proposer';
import * as storage from './storage';

export type FillPhase = 'idle' | 'running' | 'done' | 'error';
export interface FillState {
  phase: FillPhase;
  /** What the assistant is doing right now (tool being run) — shown while `running`. */
  status: string;
  /** The assistant's short written summary (streams in). */
  note: string;
  /** Steps the tool refused (invented id, wrong slot…) — surfaced so a thin result is explained, not hidden. */
  problems: string[];
  error: ChatError | null;
  batch: string | null;
  proposed: number;
}

export interface ScheduleState {
  plan: Plan;
  fill: FillState;
  /** false when the browser refused to persist (private mode / quota): the routine then lives only until the tab closes. */
  storageOk: boolean;
}

const IDLE: FillState = { phase: 'idle', status: '', note: '', problems: [], error: null, batch: null, proposed: 0 };
const loaded = storage.load();
let state: ScheduleState = { plan: loaded.plan, fill: IDLE, storageOk: loaded.ok };
let controller: AbortController | null = null;
let labelFor: (id: string) => string = (id) => id;
const listeners = new Set<() => void>();

function set(patch: Partial<ScheduleState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function commit(fn: (plan: Plan) => Plan) {
  const plan = { ...fn(state.plan), updatedAt: Date.now() };
  const ok = storage.save(plan);
  set({ plan, storageOk: ok });
}

const patchFill = (patch: Partial<FillState> | ((f: FillState) => Partial<FillState>)) =>
  set({ fill: { ...state.fill, ...(typeof patch === 'function' ? patch(state.fill) : patch) } });

/** Category labels come from the manifest; the page registers the resolver once it has loaded. */
export const registerCategoryLabels = (fn: (id: string) => string) => { labelFor = fn; };

export const updateSetup = (patch: Partial<Setup>) => commit((p) => ({ ...p, setup: { ...p.setup, ...patch } }));

export function addStep(step: Omit<Step, 'id' | 'order' | 'origin'>, origin: Step['origin'] = 'user'): string {
  const id = newId();
  commit((p) => ({ ...p, steps: [...p.steps, { ...step, id, origin, order: nextOrder(p.steps, step.slot) }] }));
  return id;
}

export const updateStep = (id: string, patch: Partial<Omit<Step, 'id' | 'origin'>>) =>
  commit((p) => ({ ...p, steps: p.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

export const removeStep = (id: string) => commit((p) => ({ ...p, steps: p.steps.filter((s) => s.id !== id) }));

export function moveStep(id: string, dir: -1 | 1) {
  commit((p) => {
    const me = p.steps.find((s) => s.id === id);
    if (!me) return p;
    const siblings = p.steps.filter((s) => s.slot === me.slot).sort((a, b) => a.order - b.order);
    const i = siblings.findIndex((s) => s.id === id);
    const j = i + dir;
    if (j < 0 || j >= siblings.length) return p;
    const reordered = [...siblings];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    const order = new Map(reordered.map((s, k) => [s.id, k]));
    return { ...p, steps: p.steps.map((s) => (order.has(s.id) ? { ...s, order: order.get(s.id)! } : s)) };
  });
}

/** Accept as proposed, or with the user's edits — either way it becomes a step and the proposal is marked accepted. */
export function acceptProposal(id: string, edits?: Partial<Proposal['step']>) {
  const prop = state.plan.proposals.find((p) => p.id === id);
  if (!prop || prop.status !== 'pending') return;
  const step = { ...prop.step, ...edits, note: edits?.note ?? (prop.step.note || prop.why) };
  commit((p) => ({
    ...p,
    steps: [...p.steps, { ...step, id: newId(), origin: 'ai' as const, order: nextOrder(p.steps, step.slot) }],
    proposals: p.proposals.map((x) => (x.id === id ? { ...x, status: 'accepted' as const } : x)),
  }));
}

export const rejectProposal = (id: string) =>
  commit((p) => ({ ...p, proposals: p.proposals.map((x) => (x.id === id && x.status === 'pending' ? { ...x, status: 'rejected' as const } : x)) }));

export const acceptAllPending = () => state.plan.proposals.filter((p) => p.status === 'pending').forEach((p) => acceptProposal(p.id));
export const rejectAllPending = () => commit((p) => ({ ...p, proposals: p.proposals.map((x) => (x.status === 'pending' ? { ...x, status: 'rejected' as const } : x)) }));

/** Decided proposals are kept for the "what did the AI suggest" record; this drops them once the user is done. */
export const clearDecided = () => commit((p) => ({ ...p, proposals: p.proposals.filter((x) => x.status === 'pending') }));

export function clearPlan() {
  stopFill();
  commit(() => EMPTY_PLAN);
}

export function stopFill() {
  controller?.abort();
  controller = null;
}

export const dismissFill = () => { if (state.fill.phase !== 'running') set({ fill: IDLE }); };

/** Pending proposals built elsewhere (the progressive planner) — same rule: they wait for the user's accept. */
export function addProposals(proposals: Proposal[]) {
  if (proposals.length) commit((p) => ({ ...p, proposals: [...p.proposals, ...proposals] }));
}

/** Used by the chat drawer too: a `propose_routine_steps` payload from any conversation lands here as pending proposals. */
export function receiveProposals(result: Record<string, unknown>, batch: string): number {
  const proposals = proposalsFrom(result, batch);
  if (proposals.length) commit((p) => ({ ...p, proposals: [...p.proposals, ...proposals] }));
  return proposals.length;
}

/** One Gemini run: same transport and prompt as the chat, so the answer is a real model call over real site data. */
export async function fillWithAssistant(scope: FillScope = { slot: null, zone: null }) {
  if (state.fill.phase === 'running') return;
  stopFill();
  const batch = newId();
  const message = fillMessage(state.plan, scope, labelFor);
  set({ fill: { ...IDLE, phase: 'running', status: 'Asking the assistant…', batch } });
  const ctl = new AbortController();
  controller = ctl;
  try {
    const transport = transportFor(await chatConfig());
    for await (const ev of transport({ message, history: [], page: getPage(), signal: ctl.signal })) apply(ev, batch);
    if (needsNudge(ctl.signal)) {
      const history = [{ role: 'user' as const, text: message }, { role: 'model' as const, text: state.fill.note }];
      patchFill({ phase: 'running', status: 'Turning the summary into proposals…', error: null, note: state.fill.note.trimEnd() + '\n\n' });
      for await (const ev of transport({ message: NUDGE_MESSAGE, history, page: getPage(), signal: ctl.signal })) apply(ev, batch);
    }
    patchFill((f) => {
      if (ctl.signal.aborted) return { phase: 'done', status: '', error: { message: 'Stopped.', code: 'aborted' } };
      if (f.phase === 'running') return { phase: 'error', status: '', error: { message: 'The stream ended before the assistant finished.', code: 'truncated', partial: f.proposed > 0 } };
      if (f.proposed === 0 && f.error === null) return { phase: 'error', status: '', error: { message: 'The assistant answered but filed no proposals. Try again, or add steps yourself.', code: 'empty' } };
      return { status: '' };
    });
  } catch (err) {
    patchFill({
      phase: 'error', status: '',
      error: ctl.signal.aborted ? { message: 'Stopped.', code: 'aborted' } : { message: (err as Error).message || 'Could not reach the assistant.', code: 'network' },
    });
  } finally {
    if (controller === ctl) controller = null;
  }
}

/** The model occasionally writes the routine as prose without calling the tool; that case gets one follow-up turn. */
const needsNudge = (signal: AbortSignal) =>
  !signal.aborted && state.fill.proposed === 0 && state.fill.error === null && state.fill.note.trim().length > 0;

function apply(ev: ChatEvent, batch: string) {
  switch (ev.event) {
    case 'tool_call':
      return patchFill({ status: toolStatus(ev.data.name, ev.data.args, labelFor) });
    case 'tool_result':
      if (ev.data.name === PROPOSE_TOOL && ev.data.error) patchFill((f) => ({ problems: [...f.problems, ev.data.error as string] }));
      return;
    case 'tool_payload': {
      if (ev.data.name !== PROPOSE_TOOL) return;
      const n = receiveProposals(ev.data.result, batch);
      return patchFill((f) => ({ proposed: f.proposed + n, problems: [...f.problems, ...problemsFrom(ev.data.result)], status: 'Writing summary…' }));
    }
    case 'text':
      return patchFill((f) => ({ note: f.note + (ev.data.delta ?? ''), status: 'Writing summary…' }));
    case 'done':
      return patchFill({ phase: 'done', status: '' });
    case 'error':
      // A partial answer that already delivered proposals is still a usable result; say what went wrong alongside it.
      return patchFill((f) => ({ error: ev.data, phase: ev.data.partial || f.proposed > 0 ? 'done' : 'error', status: '' }));
    default:
      return;
  }
}

const nextOrder = (steps: Step[], slot: Step['slot']) => steps.filter((s) => s.slot === slot).reduce((m, s) => Math.max(m, s.order + 1), 0);

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useSchedule = (): ScheduleState => useSyncExternalStore(subscribe, () => state, () => state);
