/** Gemini tool-calling loop running in the page — twin of chat_api/gemini/service.py. Yields the same ChatEvent
 * sequence the server streams over SSE: meta → (tool_call → tool_result)* → text* → done | error. */
import { ApiError, FinishReason, FunctionCallingConfigMode, GoogleGenAI, type Content, type FunctionCall, type GenerateContentConfig, type Part } from '@google/genai';
import type { ChatEvent, PageContext } from '../types';
import { pageContextBlock, systemInstruction } from './prompt';
import type { LedgerStore } from './store';
import { CitationBook, TailSplitter } from './stream';
import type { Json, ToolContext } from './tools/base';
import { sizeOf, ToolRegistry } from './tools/registry';

export interface Turn { role: 'user' | 'model'; text: string }

export interface EngineOptions {
  apiKey: string;
  model: string;
  siteUrl: string;
  maxToolRounds: number;
  maxAnswerTokens: number;
}

const HISTORY_TURNS = 12;
/** Gemini 2.5 "thinking" tokens are billed against maxOutputTokens; a fixed budget keeps them from eating the answer. */
export const THINKING_BUDGET = 1024;
/** A cut-off answer (token cap, dropped connection) is resumed this many times before it is reported as incomplete. */
export const MAX_CONTINUATIONS = 2;
const RETRY_DELAYS_MS = [800, 2000];
const TRANSIENT_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
export const CONTINUE_PROMPT = 'Your previous message stopped before it was finished (it has no FOLLOWUPS line yet). Continue exactly from where it stopped — mid-sentence or mid-table if needed — without repeating anything already written. Call tools if you still need facts, then finish the answer and end with the FOLLOWUPS line.';
export const BUDGET_PROMPT = '(Tool budget for this question is used up — answer now from the results you already have. Do not call any more tools; if something is still unknown, say so.)';

function contentsFor(message: string, history: Turn[], page: PageContext | null): Content[] {
  const contents: Content[] = history.slice(-HISTORY_TURNS).filter((t) => t.text.trim()).map((t) => ({ role: t.role, parts: [{ text: t.text }] }));
  const block = pageContextBlock(page);
  contents.push({ role: 'user', parts: [{ text: block ? `${message.trim()}\n\n${block}` : message.trim() }] });
  return contents;
}

function countOf(result: Json): number | null {
  for (const key of ['count', 'matching']) if (typeof result[key] === 'number') return result[key] as number;
  return null;
}

const errorEvent = (message: string, code: string, partial?: boolean): ChatEvent => ({ event: 'error', data: partial ? { message, code, partial } : { message, code } });

/** Rate limits, upstream 5xx and dropped connections (fetch rejects with a TypeError) are worth one more try; anything else is not. */
export function isTransient(err: unknown): boolean {
  if (err instanceof ApiError) return TRANSIENT_STATUS.has(err.status);
  if (err instanceof TypeError) return true;
  return err instanceof Error && /network|fetch|socket|stream|ECONN|reset|closed|timed? ?out/i.test(err.message);
}

const sleep = (ms: number, signal: AbortSignal) => new Promise<void>((resolve, reject) => {
  const timer = setTimeout(resolve, ms);
  signal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
});

const describeFinish = (reason: FinishReason): string => {
  switch (reason) {
    case FinishReason.MAX_TOKENS: return 'it hit the answer length limit';
    case FinishReason.SAFETY: return 'its safety filter stopped the answer';
    case FinishReason.RECITATION: return 'it stopped to avoid reciting a source verbatim';
    default: return `it stopped early (${reason})`;
  }
};

export class BrowserGeminiEngine {
  private readonly client: GoogleGenAI;
  private readonly opts: EngineOptions;
  private readonly store: LedgerStore;
  private readonly registry: ToolRegistry;

  constructor(opts: EngineOptions, store: LedgerStore, registry = new ToolRegistry()) {
    this.opts = opts; this.store = store; this.registry = registry;
    this.client = new GoogleGenAI({ apiKey: opts.apiKey });
  }

  async *chat(message: string, history: Turn[], page: PageContext | null, signal: AbortSignal): AsyncGenerator<ChatEvent> {
    let manifest;
    try {
      manifest = await this.store.manifest();
    } catch (err) {
      yield errorEvent(`Site data is unavailable right now: ${(err as Error).message}`, 'no-data');
      return;
    }
    const ctx: ToolContext = { store: this.store, siteUrl: this.opts.siteUrl, page };
    const tools = [{ functionDeclarations: this.registry.declarations(manifest).map((d) => ({ name: d.name, description: d.description, parametersJsonSchema: d.parameters })) }];
    const system = systemInstruction(manifest, this.opts.siteUrl);
    // The first request MUST call a tool: without it the model answers product questions from memory.
    const configFor = (mode: FunctionCallingConfigMode): GenerateContentConfig => ({
      systemInstruction: system,
      tools,
      toolConfig: { functionCallingConfig: { mode } },
      temperature: 0.2,
      maxOutputTokens: this.opts.maxAnswerTokens + THINKING_BUDGET,
      thinkingConfig: { thinkingBudget: THINKING_BUDGET },
      abortSignal: signal,
    });
    const contents = contentsFor(message, history, page);
    yield { event: 'meta', data: { model: this.opts.model, dataVersion: manifest.generatedAt, listings: manifest.total } };

    const splitter = new TailSplitter();
    const book = new CitationBook((id) => this.store.categoryMeta(id), page?.category?.id ?? null);
    let toolCalls = 0;
    let requests = 0;
    let retries = 0;
    let continuations = 0;
    let stoppedBy: FinishReason | Error | 'tool-limit' | null = null;
    try {
      for (let round = 0; round <= this.opts.maxToolRounds;) {
        const mode = requests === 0 ? FunctionCallingConfigMode.ANY : FunctionCallingConfigMode.AUTO;
        const modelParts: Part[] = [];
        const calls: FunctionCall[] = [];
        let finish: FinishReason | undefined;
        let roundText = '';
        let failure: Error | null = null;
        try {
          const stream = await this.client.models.generateContentStream({ model: this.opts.model, contents, config: configFor(mode) });
          for await (const chunk of stream) {
            const candidate = chunk.candidates?.[0];
            if (candidate?.finishReason) finish = candidate.finishReason;
            for (const part of candidate?.content?.parts ?? []) {
              modelParts.push(part);
              if (part.functionCall) calls.push(part.functionCall);
              else if (part.text && !part.thought) {
                roundText += part.text;
                const out = splitter.push(part.text);
                if (out) yield { event: 'text', data: { delta: out } };
                if (splitter.runaway()) {
                  yield errorEvent('The answer stopped: Gemini began repeating itself. Try asking for fewer products at once.', 'runaway', true);
                  return;
                }
              }
            }
          }
        } catch (err) {
          if (signal.aborted || !isTransient(err)) throw err;
          failure = err as Error;
        }
        if (failure && !roundText && !calls.length) {
          // Nothing of this request reached the user: repeat it after a short pause.
          if (retries >= RETRY_DELAYS_MS.length) throw failure;
          await sleep(RETRY_DELAYS_MS[retries++], signal);
          continue;
        }
        requests += 1;
        if (calls.length) {
          if (round === this.opts.maxToolRounds || toolCalls + calls.length > this.opts.maxToolRounds * 3) {
            // The model was told the budget is spent and still asked for more: end here rather than run forever.
            stoppedBy = 'tool-limit';
            break;
          }
          contents.push({ role: 'model', parts: modelParts });
          const responses: Part[] = [];
          for (const call of calls) {
            const name = call.name ?? '';
            const args: Json = { ...(call.args ?? {}) };
            toolCalls += 1;
            yield { event: 'tool_call', data: { name, args } };
            const { result, ms } = await this.registry.execute(name, args, ctx);
            book.absorb(name, result);
            const error = typeof result.error === 'string' ? result.error : null;
            yield { event: 'tool_result', data: { name, ms: Math.round(ms * 10) / 10, bytes: sizeOf(result), error, count: countOf(result) } };
            if (!error && this.registry.surfaces(name)) yield { event: 'tool_payload', data: { name, result } };
            responses.push({ functionResponse: { name, response: { result } } });
          }
          contents.push({ role: 'user', parts: responses });
          round += 1;
          if (round === this.opts.maxToolRounds) contents.push({ role: 'user', parts: [{ text: BUDGET_PROMPT }] });
          continue;
        }
        // This request carried (part of) the answer. The FOLLOWUPS line is the completeness signal: a body that ends
        // without it — token cap, dropped connection, or Gemini simply stopping mid-answer (a known 2.5 Flash habit
        // between text and a tool call) — is resumed in place instead of being shown as if it were finished.
        const cutOff = failure !== null || finish === FinishReason.MAX_TOKENS || !splitter.inFollowups;
        if (cutOff && roundText && !splitter.inFollowups && continuations < MAX_CONTINUATIONS) {
          continuations += 1;
          contents.push({ role: 'model', parts: [{ text: roundText }] });
          contents.push({ role: 'user', parts: [{ text: CONTINUE_PROMPT }] });
          continue;
        }
        if (failure) stoppedBy = failure;
        else if (finish && finish !== FinishReason.STOP && !splitter.inFollowups) stoppedBy = finish;
        break;
      }
      const tail = splitter.flush();
      if (tail) yield { event: 'text', data: { delta: tail } };
      const answer = splitter.emitted.trim();
      if (!answer) {
        if (stoppedBy instanceof Error) yield errorEvent(`Gemini API error: ${stoppedBy.message}`, 'gemini');
        else if (stoppedBy === 'tool-limit') yield errorEvent('Stopped: this question needed more lookups than one answer allows. Try asking about fewer products or categories at once.', 'tool-limit');
        else if (stoppedBy) yield errorEvent(`Gemini returned no answer: ${describeFinish(stoppedBy)}.`, 'finish');
        else yield errorEvent('Gemini returned no answer text for this question.', 'empty');
        return;
      }
      yield { event: 'done', data: { followups: splitter.followups(), citations: book.payload(answer), unverifiedCitations: book.unverified(answer), toolCalls } };
      if (stoppedBy instanceof Error) yield errorEvent(`This answer is incomplete — the connection to Gemini dropped (${stoppedBy.message}).`, 'truncated', true);
      else if (stoppedBy === 'tool-limit') yield errorEvent('This answer is incomplete — it needed more lookups than one answer allows. Ask about fewer products at once.', 'truncated', true);
      else if (stoppedBy) yield errorEvent(`This answer is incomplete — Gemini ${describeFinish(stoppedBy)}. Try asking for fewer products at once.`, 'truncated', true);
    } catch (err) {
      if (signal.aborted) throw err; // the store turns an abort into "Stopped." / keeps the partial answer
      if (err instanceof ApiError) yield errorEvent(`Gemini API error ${err.status}: ${err.message}`, 'gemini');
      else yield errorEvent(`Assistant failed: ${(err as Error).name}: ${(err as Error).message}`, 'internal');
    }
  }
}
