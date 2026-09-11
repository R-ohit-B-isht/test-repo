/** Saved conversations. Only the visible transcript is kept — never the API key, tool payloads or page snapshots. */
import type { AssistantMessage, Message } from '../types';

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface ConversationSummary { id: string; title: string; updatedAt: number; turns: number }

export const MAX_CONVERSATIONS = 40;
export const MAX_MESSAGES = 80;
const TITLE_CHARS = 56;

export const newId = (): string =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`);

export function titleFor(firstQuestion: string): string {
  const flat = firstQuestion.replace(/\s+/g, ' ').trim();
  return flat.length > TITLE_CHARS ? `${flat.slice(0, TITLE_CHARS - 1).trimEnd()}…` : flat || 'New chat';
}

export const summarise = (c: Conversation): ConversationSummary => ({ id: c.id, title: c.title, updatedAt: c.updatedAt, turns: c.messages.filter((m) => m.role === 'user').length });

/** An answer that was still streaming when the page closed can never finish: mark it, keep what arrived. */
export function settleInterrupted(m: Message): Message {
  if (m.role !== 'model' || m.phase === 'done' || m.phase === 'error') return m;
  const settled: AssistantMessage = {
    ...m, phase: m.text ? 'done' : 'error', endedAt: m.endedAt ?? m.startedAt,
    error: { message: m.text ? 'This answer was interrupted before it finished.' : 'This answer was interrupted.', code: 'interrupted', partial: !!m.text },
  };
  return settled;
}

export function relativeTime(ms: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ms) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return d === 1 ? 'yesterday' : `${d} days ago`;
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
