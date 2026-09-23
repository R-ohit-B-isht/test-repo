/** Strategy: where a question is answered. `server` streams SSE from chat-api; `browser` runs the identical tool loop in
 * the page (src/chat/local). Both yield the same ChatEvent sequence, so the store and UI never know the difference. */
import type { Turn } from './local/engine';
import { readSse } from './sse';
import type { ChatConfig, ChatEvent, PageContext } from './types';

export interface ChatRequest { message: string; history: Turn[]; page: PageContext | null; signal: AbortSignal }
export type ChatTransport = (req: ChatRequest) => AsyncIterable<ChatEvent>;

async function* serverTransport(apiBase: string, req: ChatRequest): AsyncGenerator<ChatEvent> {
  const res = await fetch(`${apiBase}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ message: req.message, history: req.history, page: req.page }),
    signal: req.signal,
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => '');
    throw new Error(`chat-api HTTP ${res.status}${detail ? ` — ${detail.slice(0, 200)}` : ''}`);
  }
  yield* readSse(res.body, req.signal);
}

async function* unconfigured(): AsyncGenerator<ChatEvent> {
  yield { event: 'error', data: { code: 'no-key', message: 'The assistant is not configured for this deployment: chat-config.json selects browser mode but carries no Gemini key.' } };
}

/** Gemini is a live service: with no connection the assistant says so instead of answering from cached data as if it had asked. */
async function* offline(): AsyncGenerator<ChatEvent> {
  yield { event: 'error', data: { code: 'offline', message: 'You are offline. The assistant needs a connection to Gemini; your saved chats and routine are still here, and product pages you opened before still load.' } };
}

let browserEngine: Promise<ChatTransport> | null = null;

/** The local engine (and @google/genai) is loaded only when browser mode is actually used, so server-mode visitors
 * never download it. One engine instance per page keeps the data caches (manifest, categories, search index) warm. */
function browserTransport(config: ChatConfig): ChatTransport {
  if (!config.gemini.apiKey) return unconfigured;
  if (!browserEngine) {
    browserEngine = Promise.all([import('./local/engine'), import('./local/store')]).then(([{ BrowserGeminiEngine }, { LedgerStore }]) => {
      const engine = new BrowserGeminiEngine(
        { apiKey: config.gemini.apiKey, model: config.gemini.model, siteUrl: config.siteUrl || window.location.origin, maxToolRounds: config.gemini.maxToolRounds, maxAnswerTokens: config.gemini.maxAnswerTokens },
        new LedgerStore(),
      );
      return (req: ChatRequest) => engine.chat(req.message, req.history, req.page, req.signal);
    });
  }
  const pending = browserEngine;
  return async function* (req) { yield* (await pending)(req); };
}

export function transportFor(config: ChatConfig): ChatTransport {
  const live = config.mode === 'browser' ? browserTransport(config) : (req: ChatRequest) => serverTransport(config.apiBase, req);
  return (req) => (typeof navigator !== 'undefined' && !navigator.onLine ? offline() : live(req));
}
