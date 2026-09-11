/** Wire types shared with `chat-api` (see chat_api/gemini/service.py Event names). Only public data crosses this boundary. */
import type { InciSourceKind, InciStatus } from '../lib/types';

/** `server`: stream from chat-api at `apiBase`. `browser`: run the same tools + Gemini in the page (key is public, referrer-locked). */
export type ChatMode = 'server' | 'browser';
export interface GeminiBrowserConfig { apiKey: string; model: string; maxToolRounds: number; maxAnswerTokens: number }
export interface ChatConfig { mode: ChatMode; apiBase: string; siteUrl: string; gemini: GeminiBrowserConfig }

export interface CitedProduct {
  id: string; category: string; brand: string; title: string;
  rank: number | null; of: number | null; score: number | null; priceInr: number | null; store: string | null; url: string | null;
  inciStatus?: InciStatus | null; inciSourceKind?: InciSourceKind | null;
}
export interface CitedCategory { id: string; label?: string; zone?: string; listings?: number; url?: string }
export interface ExternalSource { label: string; url: string; kind: string | null }
export interface Citations { products: CitedProduct[]; categories: CitedCategory[]; external: ExternalSource[] }

export interface ToolCallTrace { name: string; args: Record<string, unknown>; ms?: number; bytes?: number; error?: string | null; count?: number | null }

export interface ChatError { message: string; code: string; partial?: boolean }
export interface ChatMeta { model: string; dataVersion: string | null; listings: number | null }

export type ChatEvent =
  | { event: 'meta'; data: ChatMeta }
  | { event: 'tool_call'; data: { name: string; args: Record<string, unknown> } }
  | { event: 'tool_result'; data: { name: string; ms: number; bytes: number; error: string | null; count: number | null } }
  /** Full result of a tool that feeds a UI surface (routine proposals); ordinary tool results never cross this boundary. */
  | { event: 'tool_payload'; data: { name: string; result: Record<string, unknown> } }
  | { event: 'text'; data: { delta: string } }
  | { event: 'done'; data: { followups: string[]; citations: Citations; unverifiedCitations: string[]; toolCalls: number } }
  | { event: 'error'; data: ChatError };

export type Phase = 'idle' | 'connecting' | 'tools' | 'writing' | 'done' | 'error';

export interface UserMessage { id: number; role: 'user'; text: string }
export interface AssistantMessage {
  id: number; role: 'model'; text: string; phase: Phase;
  tools: ToolCallTrace[]; citations: Citations | null; unverified: string[]; followups: string[]; error: ChatError | null;
  meta: ChatMeta | null; startedAt: number; endedAt: number | null;
  /** Routine steps this answer proposed (pending on the My routine page); absent on answers that proposed none. */
  proposed?: number;
}
export type Message = UserMessage | AssistantMessage;

/** What the user is looking at — published by pages, read by the chat when a question is sent. Mirrors prompt.page_context_block. */
export interface PageContext {
  route: string;
  theme?: string;
  dataVersion?: string | null;
  category?: { id: string; label: string; zone: string; count: number } | null;
  filters?: string[];
  query?: string;
  sort?: string;
  resultCount?: number | null;
  product?: { id: string; brand: string; title: string; rank: number } | null;
  compare?: string[];
  benchmark?: string | null;
  /** My routine page: the user's setup and what is already planned, so a fill request can be answered from the drawer too. */
  routine?: { zones: string[]; concerns: string[]; skinType: string | null; maxPriceInr: number | null; steps: number; pending: number } | null;
}
