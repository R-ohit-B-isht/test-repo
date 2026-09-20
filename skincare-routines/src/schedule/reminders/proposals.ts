/** Reminder changes proposed by the assistant ("remind me at 10 pm", "turn the morning reminder off"): pending until the
 * user applies or rejects them, kept under their own key so an undecided card never touches the live settings. */
import { useSyncExternalStore } from 'react';
import type { Slot } from '../model';
import { isTime, reminderSettings, setSlotEnabled, setSlotTime, type SlotReminder } from './store';

const KEY = 'ledger.routine.reminders.pending.v1';
export const REMIND_TOOL = 'set_reminders';
const MAX_KEPT = 40;

export interface ReminderProposal {
  id: string;
  slot: Slot;
  before: SlotReminder;
  after: SlotReminder;
  why: string;
  status: 'pending' | 'accepted' | 'rejected';
  batch: string;
  createdAt: number;
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isSlot = (v: unknown): v is Slot => v === 'am' || v === 'pm';

function validSlotReminder(v: unknown): SlotReminder | null {
  if (!isRecord(v) || typeof v.enabled !== 'boolean' || typeof v.time !== 'string' || !isTime(v.time)) return null;
  return { enabled: v.enabled, time: v.time };
}

function validProposal(v: unknown): ReminderProposal | null {
  if (!isRecord(v) || typeof v.id !== 'string' || !isSlot(v.slot)) return null;
  const before = validSlotReminder(v.before);
  const after = validSlotReminder(v.after);
  if (!before || !after) return null;
  const status = v.status === 'accepted' || v.status === 'rejected' ? v.status : 'pending';
  return { id: v.id, slot: v.slot, before, after, why: typeof v.why === 'string' ? v.why : '', status, batch: typeof v.batch === 'string' ? v.batch : '', createdAt: typeof v.createdAt === 'number' ? v.createdAt : 0 };
}

function load(): ReminderProposal[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const p: unknown = JSON.parse(raw);
    return Array.isArray(p) ? p.map(validProposal).filter((x): x is ReminderProposal => x !== null) : [];
  } catch {
    return [];
  }
}

let state: ReminderProposal[] = load();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const snapshot = () => state;

function set(next: ReminderProposal[]) {
  state = next.slice(-MAX_KEPT);
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { /* private mode / quota */ }
  listeners.forEach((l) => l());
}

export const useReminderProposals = (): ReminderProposal[] => useSyncExternalStore(subscribe, snapshot, snapshot);
export const reminderProposals = (): ReminderProposal[] => state;
export const pendingReminderProposals = () => state.filter((p) => p.status === 'pending');

let seq = 0;
const newId = () => `rp-${Date.now().toString(36)}-${(seq++).toString(36)}`;

/** Takes the `set_reminders` tool payload and files each valid change as a pending card; returns how many landed.
 * `before` is re-read from the live settings, so a card always diffs against what is actually set now. */
export function receiveReminderChanges(payload: unknown, batch: string): number {
  if (!isRecord(payload) || !Array.isArray(payload.changes)) return 0;
  const now = reminderSettings();
  const added: ReminderProposal[] = [];
  for (const raw of payload.changes) {
    if (!isRecord(raw) || !isSlot(raw.slot)) continue;
    const before = now.slots[raw.slot];
    const enabled = typeof raw.enabled === 'boolean' ? raw.enabled : before.enabled;
    const time = typeof raw.time === 'string' && isTime(raw.time) ? raw.time : before.time;
    if (enabled === before.enabled && time === before.time) continue;
    if (added.some((a) => a.slot === raw.slot)) continue;
    added.push({ id: newId(), slot: raw.slot, before, after: { enabled, time }, why: typeof raw.why === 'string' ? raw.why : '', status: 'pending', batch, createdAt: Date.now() });
  }
  if (added.length) set([...state.filter((p) => p.status !== 'pending' || !added.some((a) => a.slot === p.slot)), ...added]);
  return added.length;
}

/** Applies one card to the live settings; a card whose slot was changed by hand since (time or switch differs from its
 * `before`) is refused so the assistant's older intent never overrides what the user just set. */
export function acceptReminderProposal(id: string): { applied: boolean; reason?: string } {
  const p = state.find((x) => x.id === id && x.status === 'pending');
  if (!p) return { applied: false, reason: 'This reminder change was already decided.' };
  const now = reminderSettings().slots[p.slot];
  if (now.enabled !== p.before.enabled || now.time !== p.before.time) {
    set(state.map((x) => (x.id === id ? { ...x, status: 'rejected' as const } : x)));
    return { applied: false, reason: `The ${p.slot === 'am' ? 'morning' : 'night'} reminder was changed by hand since, so this change was dropped.` };
  }
  if (p.after.time !== now.time) setSlotTime(p.slot, p.after.time);
  if (p.after.enabled !== now.enabled) setSlotEnabled(p.slot, p.after.enabled);
  set(state.map((x) => (x.id === id ? { ...x, status: 'accepted' as const } : x)));
  return { applied: true };
}

export function rejectReminderProposal(id: string) {
  set(state.map((x) => (x.id === id && x.status === 'pending' ? { ...x, status: 'rejected' as const } : x)));
}

export function rejectAllReminderProposals() {
  set(state.map((x) => (x.status === 'pending' ? { ...x, status: 'rejected' as const } : x)));
}

export function clearDecidedReminderProposals() {
  set(state.filter((x) => x.status === 'pending'));
}
