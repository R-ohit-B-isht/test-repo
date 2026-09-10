/** Gemini tool-calling loop running in the page — twin of chat_api/gemini/service.py. Yields the same ChatEvent
 * sequence the server streams over SSE: meta → (tool_call → tool_result)* → text* → done | error. */
import { ApiError, FunctionCallingConfigMode, GoogleGenAI, type Content, type FunctionCall, type GenerateContentConfig, type Part } from '@google/genai';
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
    // The first round MUST call a tool: without it the model happily answers product questions from memory.
    const configFor = (forceTool: boolean): GenerateContentConfig => ({
      systemInstruction: system,
      tools,
      toolConfig: { functionCallingConfig: { mode: forceTool ? FunctionCallingConfigMode.ANY : FunctionCallingConfigMode.AUTO } },
      temperature: 0.2,
      maxOutputTokens: this.opts.maxAnswerTokens,
      abortSignal: signal,
    });
    const contents = contentsFor(message, history, page);
    yield { event: 'meta', data: { model: this.opts.model, dataVersion: manifest.generatedAt, listings: manifest.total } };

    const splitter = new TailSplitter();
    const book = new CitationBook((id) => this.store.categoryMeta(id), page?.category?.id ?? null);
    let toolCalls = 0;
    try {
      for (let round = 0; round <= this.opts.maxToolRounds; round++) {
        const modelParts: Part[] = [];
        const calls: FunctionCall[] = [];
        const stream = await this.client.models.generateContentStream({ model: this.opts.model, contents, config: configFor(round === 0) });
        for await (const chunk of stream) {
          for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
            modelParts.push(part);
            if (part.functionCall) calls.push(part.functionCall);
            else if (part.text && !part.thought) {
              const out = splitter.push(part.text);
              if (out) yield { event: 'text', data: { delta: out } };
              if (splitter.runaway()) {
                yield errorEvent('The answer stopped: Gemini began repeating itself. Try asking for fewer products at once.', 'runaway', true);
                return;
              }
            }
          }
        }
        if (!calls.length) break;
        if (toolCalls + calls.length > this.opts.maxToolRounds * 3) {
          yield errorEvent('Stopped: too many tool calls for one question.', 'tool-limit');
          return;
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
          responses.push({ functionResponse: { name, response: { result } } });
        }
        contents.push({ role: 'user', parts: responses });
      }
      const tail = splitter.flush();
      if (tail) yield { event: 'text', data: { delta: tail } };
      const answer = splitter.emitted.trim();
      if (!answer) {
        yield errorEvent('Gemini returned no answer text for this question.', 'empty');
        return;
      }
      yield { event: 'done', data: { followups: splitter.followups(), citations: book.payload(answer), unverifiedCitations: book.unverified(answer), toolCalls } };
    } catch (err) {
      if (signal.aborted) throw err; // the store turns an abort into "Stopped." / keeps the partial answer
      if (err instanceof ApiError) yield errorEvent(`Gemini API error ${err.status}: ${err.message}`, 'gemini');
      else yield errorEvent(`Assistant failed: ${(err as Error).name}: ${(err as Error).message}`, 'internal');
    }
  }
}
