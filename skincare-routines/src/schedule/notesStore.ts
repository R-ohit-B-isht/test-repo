/** Internal notes: free text kept only in this browser, in its own record (`ledger.notes.v1`), apart from the routine
 * and never published to the page context — the assistant does not read them and they are not product evidence. */
import { useSyncExternalStore } from 'react';
import { newId } from './model';

const KEY = 'ledger.notes.v1';
const MAX_NOTES = 200;
export const MAX_NOTE_CHARS = 4000;

export interface Note { id: string; title: string; body: string; createdAt: number; updatedAt: number }
export interface NotesState { notes: Note[]; ok: boolean }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

function validNote(v: unknown): Note | null {
  if (!isRecord(v) || typeof v.id !== 'string') return null;
  return { id: v.id, title: str(v.title, 120), body: str(v.body, MAX_NOTE_CHARS), createdAt: num(v.createdAt), updatedAt: num(v.updatedAt) };
}

function load(): NotesState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { notes: [], ok: true };
    const parsed: unknown = JSON.parse(raw);
    const list = isRecord(parsed) && Array.isArray(parsed.notes) ? parsed.notes : [];
    return { notes: list.map(validNote).filter((n): n is Note => n !== null).slice(0, MAX_NOTES), ok: true };
  } catch {
    return { notes: [], ok: false };
  }
}

function save(notes: Note[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, notes }));
    return true;
  } catch {
    return false;
  }
}

let state: NotesState = load();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const snapshot = () => state;

function set(notes: Note[]) {
  state = { notes, ok: save(notes) };
  listeners.forEach((l) => l());
}

export const useNotes = () => useSyncExternalStore(subscribe, snapshot, snapshot);

export function addNote(): Note {
  const now = Date.now();
  const note: Note = { id: newId(), title: '', body: '', createdAt: now, updatedAt: now };
  set([note, ...state.notes].slice(0, MAX_NOTES));
  return note;
}

export const updateNote = (id: string, patch: Partial<Pick<Note, 'title' | 'body'>>) =>
  set(state.notes.map((n) => (n.id === id ? { ...n, ...patch, title: (patch.title ?? n.title).slice(0, 120), body: (patch.body ?? n.body).slice(0, MAX_NOTE_CHARS), updatedAt: Date.now() } : n)));

export const removeNote = (id: string) => set(state.notes.filter((n) => n.id !== id));
