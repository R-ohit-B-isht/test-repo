import { loadJson } from '../data/fetchJson';
import type { ChatConfig, ChatMode } from './types';

const URL = `${import.meta.env.BASE_URL}chat-config.json`;
const DEFAULT_MODEL = 'gemini-2.5-flash';

/** Same-origin `/api` server mode unless the deploy's chat-config.json says otherwise. The repo file never holds a key:
 * in browser mode the deploy step writes the (HTTP-referrer-restricted) key into dist/chat-config.json. */
const FALLBACK: ChatConfig = { mode: 'server', apiBase: '', siteUrl: '', gemini: { apiKey: '', model: DEFAULT_MODEL, maxToolRounds: 8, maxAnswerTokens: 1800 } };

const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);
const int = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : fallback);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function normalise(raw: unknown): ChatConfig {
  const c = isObj(raw) ? raw : {};
  const g = isObj(c.gemini) ? c.gemini : {};
  const mode: ChatMode = c.mode === 'browser' ? 'browser' : 'server';
  return {
    mode,
    apiBase: str(c.apiBase).replace(/\/$/, ''),
    siteUrl: str(c.siteUrl).replace(/\/$/, ''),
    gemini: {
      apiKey: str(g.apiKey),
      model: str(g.model, DEFAULT_MODEL),
      maxToolRounds: int(g.maxToolRounds, FALLBACK.gemini.maxToolRounds),
      maxAnswerTokens: int(g.maxAnswerTokens, FALLBACK.gemini.maxAnswerTokens),
    },
  };
}

/** `npm run dev` only: VITE_GEMINI_API_KEY in .env.local (git-ignored) switches to browser mode without editing the
 * public config. Guarded by DEV so a stray variable at build time can never bake a key into a production bundle. */
function devOverride(config: ChatConfig): ChatConfig {
  const key = import.meta.env.DEV ? str(import.meta.env.VITE_GEMINI_API_KEY) : '';
  return key ? { ...config, mode: 'browser', gemini: { ...config.gemini, apiKey: key } } : config;
}

let cached: Promise<ChatConfig> | null = null;

/** Runtime (not build-time) transport selection so the same static bundle can run against a chat-api host or on its own. */
export function chatConfig(): Promise<ChatConfig> {
  if (!cached) cached = loadJson<unknown>(URL).then(normalise).catch(() => FALLBACK).then(devOverride);
  return cached;
}
