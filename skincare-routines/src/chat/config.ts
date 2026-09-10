import { loadJson } from '../data/fetchJson';
import type { ChatConfig } from './types';

const URL = `${import.meta.env.BASE_URL}chat-config.json`;
/** Same-origin `/api` unless the deploy's chat-config.json points at a separate backend. Never holds a secret. */
const FALLBACK: ChatConfig = { apiBase: '' };

let cached: Promise<ChatConfig> | null = null;

/** Runtime (not build-time) backend location so the same static bundle can be pointed at any chat-api host. */
export function chatConfig(): Promise<ChatConfig> {
  if (!cached) {
    cached = loadJson<Partial<ChatConfig>>(URL)
      .then((c) => ({ apiBase: typeof c.apiBase === 'string' ? c.apiBase.replace(/\/$/, '') : '' }))
      .catch(() => FALLBACK);
  }
  return cached;
}
