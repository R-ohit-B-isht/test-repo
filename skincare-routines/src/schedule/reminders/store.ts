/** Reminder settings for this device — times, on/off, and the push registration state — kept apart from the routine record
 * (`ledger.routine.v1`) so turning a reminder on or off never rewrites a step, and an existing routine gets reminders
 * the moment it is opened here. */
import { useSyncExternalStore } from 'react';
import type { Slot } from '../model';

const KEY = 'ledger.routine.reminders.v1';

export interface SlotReminder { enabled: boolean; time: string }
export interface PushState {
  /** The push endpoint registered with the reminder service on this device, or null when push is off. */
  endpoint: string | null;
  /** VAPID public key the subscription was made with — a different one from the server means re-subscribe. */
  publicKey: string | null;
  syncedAt: number | null;
  /** Fingerprint of the last record the server accepted, so nothing is re-sent while the routine is unchanged. */
  syncedHash: string | null;
  lastError: string | null;
}
export interface ReminderSettings {
  version: 1;
  slots: Record<Slot, SlotReminder>;
  /** Stay quiet on days where the slot has no steps. */
  onlyRoutineDays: boolean;
  push: PushState;
}

export const DEFAULT_TIMES: Record<Slot, string> = { am: '07:30', pm: '21:30' };
const NO_PUSH: PushState = { endpoint: null, publicKey: null, syncedAt: null, syncedHash: null, lastError: null };
export const DEFAULTS: ReminderSettings = {
  version: 1,
  slots: { am: { enabled: false, time: DEFAULT_TIMES.am }, pm: { enabled: false, time: DEFAULT_TIMES.pm } },
  onlyRoutineDays: true,
  push: NO_PUSH,
};

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const isTime = (v: string) => TIME.test(v);
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

function slotOf(v: unknown, fallback: SlotReminder): SlotReminder {
  if (!isRecord(v)) return fallback;
  const time = str(v.time);
  return { enabled: v.enabled === true, time: time && isTime(time) ? time : fallback.time };
}

function load(): ReminderSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const p: unknown = JSON.parse(raw);
    if (!isRecord(p) || p.version !== 1) return DEFAULTS;
    const slots = isRecord(p.slots) ? p.slots : {};
    const push = isRecord(p.push) ? p.push : {};
    return {
      version: 1,
      slots: { am: slotOf(slots.am, DEFAULTS.slots.am), pm: slotOf(slots.pm, DEFAULTS.slots.pm) },
      onlyRoutineDays: p.onlyRoutineDays !== false,
      push: { endpoint: str(push.endpoint), publicKey: str(push.publicKey), syncedAt: num(push.syncedAt), syncedHash: str(push.syncedHash), lastError: str(push.lastError) },
    };
  } catch {
    return DEFAULTS;
  }
}

function save(s: ReminderSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); }
  catch { /* private mode / quota: settings live until the tab closes */ }
}

let state: ReminderSettings = load();
const listeners = new Set<() => void>();
// Another tab (or the installed app beside a browser tab) saved: adopt its copy instead of overwriting it later.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY && e.key !== null) return;
    state = load();
    listeners.forEach((l) => l());
  });
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const snapshot = () => state;

function set(next: ReminderSettings) {
  state = next;
  save(next);
  listeners.forEach((l) => l());
}

export const useReminders = (): ReminderSettings => useSyncExternalStore(subscribe, snapshot, snapshot);
export const reminderSettings = (): ReminderSettings => state;

export function setSlotEnabled(slot: Slot, enabled: boolean) {
  set({ ...state, slots: { ...state.slots, [slot]: { ...state.slots[slot], enabled } } });
}

export function setSlotTime(slot: Slot, time: string) {
  if (!isTime(time)) return;
  set({ ...state, slots: { ...state.slots, [slot]: { ...state.slots[slot], time } } });
}

export function setOnlyRoutineDays(onlyRoutineDays: boolean) {
  set({ ...state, onlyRoutineDays });
}

export function setPush(patch: Partial<PushState>) {
  set({ ...state, push: { ...state.push, ...patch } });
}

export function clearPush() {
  set({ ...state, push: NO_PUSH });
}

export const anyEnabled = (s: ReminderSettings) => s.slots.am.enabled || s.slots.pm.enabled;
