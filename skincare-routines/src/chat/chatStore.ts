import { useSyncExternalStore } from 'react';
import { chatConfig } from './config';
import { getPage } from './pageContext';
import { readSse } from './sse';
import type { AssistantMessage, ChatEvent, Message, PageContext } from './types';

export interface ChatState { open: boolean; messages: Message[]; busy: boolean; lastPage: PageContext | null }

const HISTORY_TURNS = 12;
let state: ChatState = { open: false, messages: [], busy: false, lastPage: null };
let seq = 0;
let controller: AbortController | null = null;
const listeners = new Set<() => void>();

function set(patch: Partial<ChatState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function patchAssistant(id: number, patch: Partial<AssistantMessage> | ((m: AssistantMessage) => Partial<AssistantMessage>)) {
  set({
    messages: state.messages.map((m) => (m.id === id && m.role === 'model' ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)),
  });
}

export const openChat = () => set({ open: true });
export const closeChat = () => set({ open: false });
export const toggleChat = () => set({ open: !state.open });

export function stopChat() {
  controller?.abort();
  controller = null;
}

export function clearChat() {
  stopChat();
  set({ messages: [], busy: false, lastPage: null });
}

/** Retry re-sends the last user question with the same page snapshot, dropping the failed answer (Yelp Assistant retry). */
export function retryLast() {
  const lastUser = [...state.messages].reverse().find((m) => m.role === 'user');
  if (!lastUser || state.busy) return;
  const idx = state.messages.lastIndexOf(lastUser);
  set({ messages: state.messages.slice(0, idx) });
  void send(lastUser.text);
}

/** Streams one question through chat-api. The history sent is the visible transcript (bounded), never the tool payloads. */
export async function send(text: string) {
  const message = text.trim();
  if (!message || state.busy) return;
  stopChat();
  const page = getPage();
  const history = state.messages
    .filter((m) => (m.role === 'user' ? true : m.phase === 'done' && m.text.trim()))
    .slice(-HISTORY_TURNS)
    .map((m) => ({ role: m.role, text: m.text }));
  const userId = ++seq;
  const modelId = ++seq;
  const draft: AssistantMessage = {
    id: modelId, role: 'model', text: '', phase: 'connecting', tools: [], citations: null, unverified: [], followups: [],
    error: null, meta: null, startedAt: performance.now(), endedAt: null,
  };
  set({ busy: true, lastPage: page, messages: [...state.messages, { id: userId, role: 'user', text: message }, draft] });

  const ctl = new AbortController();
  controller = ctl;
  try {
    const { apiBase } = await chatConfig();
    const res = await fetch(`${apiBase}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ message, history, page }),
      signal: ctl.signal,
    });
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => '');
      throw new Error(`chat-api HTTP ${res.status}${detail ? ` — ${detail.slice(0, 200)}` : ''}`);
    }
    for await (const ev of readSse(res.body, ctl.signal)) apply(modelId, ev);
    patchAssistant(modelId, (m) => (m.phase === 'done' || m.phase === 'error' ? {} : {
      phase: 'error', endedAt: performance.now(),
      error: { message: 'The stream ended before Gemini finished its answer.', code: 'truncated', partial: !!m.text },
    }));
  } catch (err) {
    const aborted = ctl.signal.aborted;
    patchAssistant(modelId, (m) => ({
      phase: aborted && m.text ? 'done' : 'error', endedAt: performance.now(),
      error: aborted ? (m.text ? null : { message: 'Stopped.', code: 'aborted' }) : { message: (err as Error).message || 'Could not reach the assistant.', code: 'network' },
    }));
  } finally {
    if (controller === ctl) controller = null;
    set({ busy: false });
  }
}

function apply(id: number, ev: ChatEvent) {
  switch (ev.event) {
    case 'meta':
      return patchAssistant(id, { meta: ev.data, phase: 'tools' });
    case 'tool_call':
      return patchAssistant(id, (m) => ({ phase: 'tools', tools: [...m.tools, { name: ev.data.name, args: ev.data.args }] }));
    case 'tool_result':
      return patchAssistant(id, (m) => {
        const i = m.tools.map((t) => t.name).lastIndexOf(ev.data.name);
        const tools = m.tools.map((t, k) => (k === i ? { ...t, ms: ev.data.ms, bytes: ev.data.bytes, error: ev.data.error, count: ev.data.count } : t));
        return { tools };
      });
    case 'text':
      return patchAssistant(id, (m) => ({ phase: 'writing', text: m.text + (ev.data.delta ?? '') }));
    case 'done':
      // Wire payloads are normalised here so a backend/frontend version skew degrades to a plain answer, never a render crash.
      return patchAssistant(id, {
        phase: 'done', endedAt: performance.now(),
        followups: Array.isArray(ev.data.followups) ? ev.data.followups.filter((f): f is string => typeof f === 'string') : [],
        citations: ev.data.citations ?? null,
        unverified: Array.isArray(ev.data.unverifiedCitations) ? ev.data.unverifiedCitations : [],
      });
    case 'error':
      return patchAssistant(id, (m) => ({
        phase: ev.data.partial && m.text ? 'done' : 'error', endedAt: performance.now(), error: ev.data,
      }));
  }
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useChat = (): ChatState => useSyncExternalStore(subscribe, () => state, () => state);
