import { useSyncExternalStore } from 'react';
import { chatConfig } from './config';
import { newId, settleInterrupted, summarise, titleFor, type Conversation, type ConversationSummary } from './history/model';
import * as storage from './history/storage';
import { getPage } from './pageContext';
import { PROPOSE_TOOL } from '../schedule/proposer';
import { receiveProposals } from '../schedule/scheduleStore';
import { transportFor } from './transport';
import type { AssistantMessage, ChatEvent, Message, PageContext } from './types';

export type ChatView = 'chat' | 'history';
export interface ChatState {
  open: boolean; view: ChatView; messages: Message[]; busy: boolean; lastPage: PageContext | null;
  activeId: string | null; conversations: ConversationSummary[];
  /** false when the browser refused to persist (private mode / quota): chats then live only until the tab closes. */
  storageOk: boolean;
}

const HISTORY_TURNS = 12;
const SAVE_DEBOUNCE_MS = 300;

const loaded = storage.load();
let conversations: Conversation[] = loaded.conversations;
let state: ChatState = {
  open: false, view: 'chat', busy: false, lastPage: null,
  activeId: loaded.active, messages: conversations.find((c) => c.id === loaded.active)?.messages ?? [],
  conversations: conversations.map(summarise), storageOk: loaded.ok,
};
let seq = Math.max(0, ...conversations.flatMap((c) => c.messages.map((m) => m.id)));
let controller: AbortController | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function set(patch: Partial<ChatState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function persist(immediate = false) {
  if (saveTimer) clearTimeout(saveTimer);
  const write = () => { saveTimer = null; const ok = storage.save(conversations, state.activeId); if (ok !== state.storageOk) set({ storageOk: ok }); };
  if (immediate) write(); else saveTimer = setTimeout(write, SAVE_DEBOUNCE_MS);
}

/** Every transcript edit goes through here: the conversation is the record, `state.messages` mirrors the open one. */
function updateConversation(id: string, fn: (messages: Message[]) => Message[], opts: { touch?: boolean; flush?: boolean } = {}) {
  const idx = conversations.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const conv = { ...conversations[idx], messages: fn(conversations[idx].messages), updatedAt: opts.touch ? Date.now() : conversations[idx].updatedAt };
  conversations = [conv, ...conversations.slice(0, idx), ...conversations.slice(idx + 1)];
  set({ conversations: conversations.map(summarise), ...(state.activeId === id ? { messages: conv.messages } : {}) });
  persist(opts.flush);
}

function patchAssistant(convId: string, id: number, patch: Partial<AssistantMessage> | ((m: AssistantMessage) => Partial<AssistantMessage>)) {
  const terminal = typeof patch !== 'function' && (patch.phase === 'done' || patch.phase === 'error');
  updateConversation(convId, (msgs) => msgs.map((m) => (m.id === id && m.role === 'model' ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)), { flush: terminal });
}

export const openChat = () => set({ open: true });
export const closeChat = () => set({ open: false });
export const toggleChat = () => set({ open: !state.open });
export const showHistory = () => set({ view: 'history' });
export const showChat = () => set({ view: 'chat' });

export function stopChat() {
  controller?.abort();
  controller = null;
}

/** Start a fresh conversation; the current one stays in history (an in-flight answer is stopped and kept as partial). */
export function newChat() {
  stopChat();
  set({ activeId: null, messages: [], view: 'chat', lastPage: null });
  persist(true);
}

export function openConversation(id: string) {
  const conv = conversations.find((c) => c.id === id);
  if (!conv) return;
  stopChat();
  set({ activeId: id, messages: conv.messages.map(settleInterrupted), view: 'chat' });
  persist(true);
}

export function deleteConversation(id: string) {
  if (state.activeId === id) stopChat();
  conversations = conversations.filter((c) => c.id !== id);
  set({ conversations: conversations.map(summarise), ...(state.activeId === id ? { activeId: null, messages: [] } : {}) });
  persist(true);
}

/** Retry re-sends the last user question with the same page snapshot, dropping the failed answer (Yelp Assistant retry). */
export function retryLast() {
  const lastUser = [...state.messages].reverse().find((m) => m.role === 'user');
  if (!lastUser || state.busy || !state.activeId) return;
  const idx = state.messages.lastIndexOf(lastUser);
  updateConversation(state.activeId, (msgs) => msgs.slice(0, idx));
  void send(lastUser.text);
}

/** Streams one question through the configured transport (chat-api or the in-page engine). The history sent is the
 * visible transcript (bounded), never the tool payloads. */
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
  let convId = state.activeId;
  if (!convId) {
    convId = newId();
    const now = Date.now();
    conversations = [{ id: convId, title: titleFor(message), createdAt: now, updatedAt: now, messages: [] }, ...conversations];
    set({ activeId: convId, view: 'chat' });
  }
  set({ busy: true, lastPage: page });
  updateConversation(convId, (msgs) => [...msgs, { id: userId, role: 'user', text: message }, draft], { touch: true, flush: true });

  const ctl = new AbortController();
  controller = ctl;
  try {
    const transport = transportFor(await chatConfig());
    for await (const ev of transport({ message, history, page, signal: ctl.signal })) apply(convId, modelId, ev);
    patchAssistant(convId, modelId, (m) => (m.phase === 'done' || m.phase === 'error' ? {} : ctl.signal.aborted ? stopped(m) : {
      phase: 'error', endedAt: performance.now(),
      error: { message: 'The stream ended before Gemini finished its answer.', code: 'truncated', partial: !!m.text },
    }));
  } catch (err) {
    patchAssistant(convId, modelId, (m) => (ctl.signal.aborted ? stopped(m) : {
      phase: 'error', endedAt: performance.now(),
      error: { message: (err as Error).message || 'Could not reach the assistant.', code: 'network' },
    }));
  } finally {
    if (controller === ctl) controller = null;
    set({ busy: false });
    persist(true);
  }
}

/** User pressed Stop: keep whatever streamed and say so — a cut-off answer must not look like a finished one. */
const stopped = (m: AssistantMessage): Partial<AssistantMessage> => ({
  phase: m.text ? 'done' : 'error', endedAt: performance.now(),
  error: { message: m.text ? 'Stopped — this answer is incomplete.' : 'Stopped.', code: 'aborted', partial: !!m.text },
});

function apply(convId: string, id: number, ev: ChatEvent) {
  switch (ev.event) {
    case 'meta':
      return patchAssistant(convId, id, { meta: ev.data, phase: 'tools' });
    case 'tool_call':
      return patchAssistant(convId, id, (m) => ({ phase: 'tools', tools: [...m.tools, { name: ev.data.name, args: ev.data.args }] }));
    case 'tool_result':
      return patchAssistant(convId, id, (m) => {
        const i = m.tools.map((t) => t.name).lastIndexOf(ev.data.name);
        const tools = m.tools.map((t, k) => (k === i ? { ...t, ms: ev.data.ms, bytes: ev.data.bytes, error: ev.data.error, count: ev.data.count } : t));
        return { tools };
      });
    case 'tool_payload': {
      // Routine proposals land on the My routine page as pending cards; the transcript only records how many.
      if (ev.data.name !== PROPOSE_TOOL) return;
      const n = receiveProposals(ev.data.result, `chat-${convId}-${id}`);
      return patchAssistant(convId, id, (m) => ({ proposed: (m.proposed ?? 0) + n }));
    }
    case 'text':
      return patchAssistant(convId, id, (m) => ({ phase: 'writing', text: m.text + (ev.data.delta ?? '') }));
    case 'done':
      // Wire payloads are normalised here so a backend/frontend version skew degrades to a plain answer, never a render crash.
      return patchAssistant(convId, id, {
        phase: 'done', endedAt: performance.now(),
        followups: Array.isArray(ev.data.followups) ? ev.data.followups.filter((f): f is string => typeof f === 'string') : [],
        citations: ev.data.citations ?? null,
        unverified: Array.isArray(ev.data.unverifiedCitations) ? ev.data.unverifiedCitations : [],
      });
    case 'error':
      return patchAssistant(convId, id, (m) => ({
        phase: ev.data.partial && m.text ? 'done' : 'error', endedAt: performance.now(), error: ev.data,
      }));
  }
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useChat = (): ChatState => useSyncExternalStore(subscribe, () => state, () => state);
