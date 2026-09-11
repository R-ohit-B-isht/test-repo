/** localStorage adapter for chat history (Memento: the store hands over a snapshot, this file only persists/restores it).
 * Corrupt or unavailable storage yields an empty list plus a flag — never invented history. */
import { MAX_CONVERSATIONS, MAX_MESSAGES, settleInterrupted, type Conversation } from './model';

const KEY = 'ledger.chat.v1';
const VERSION = 1;

interface Envelope { v: number; active: string | null; conversations: Conversation[] }
export interface Loaded { conversations: Conversation[]; active: string | null; ok: boolean }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function validConversation(v: unknown): v is Conversation {
  return isRecord(v) && typeof v.id === 'string' && typeof v.title === 'string' && typeof v.createdAt === 'number'
    && typeof v.updatedAt === 'number' && Array.isArray(v.messages);
}

export function load(): Loaded {
  let raw: string | null;
  try { raw = localStorage.getItem(KEY); } catch { return { conversations: [], active: null, ok: false }; }
  if (!raw) return { conversations: [], active: null, ok: true };
  try {
    const env = JSON.parse(raw) as Partial<Envelope>;
    if (env.v !== VERSION || !Array.isArray(env.conversations)) return { conversations: [], active: null, ok: true };
    const conversations = env.conversations.filter(validConversation)
      .map((c) => ({ ...c, messages: c.messages.slice(-MAX_MESSAGES).map(settleInterrupted) }))
      .filter((c) => c.messages.length > 0)
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_CONVERSATIONS);
    const active = typeof env.active === 'string' && conversations.some((c) => c.id === env.active) ? env.active : null;
    return { conversations, active, ok: true };
  } catch {
    return { conversations: [], active: null, ok: true };
  }
}

/** Returns false when the browser refused the write (private mode, quota) so the UI can say history is not being kept. */
export function save(conversations: Conversation[], active: string | null): boolean {
  const env: Envelope = {
    v: VERSION, active,
    conversations: conversations.filter((c) => c.messages.length > 0).slice(0, MAX_CONVERSATIONS).map((c) => ({ ...c, messages: c.messages.slice(-MAX_MESSAGES) })),
  };
  try { localStorage.setItem(KEY, JSON.stringify(env)); return true; } catch { return false; }
}
