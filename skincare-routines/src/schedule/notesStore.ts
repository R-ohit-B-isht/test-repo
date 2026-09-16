/** Internal notes: free text kept only in this browser, in its own record (`ledger.notes.v1`), apart from the routine
 * and never published to the page context — the assistant does not read them and they are not product evidence. */
import { useSyncExternalStore } from 'react';
import { newId } from './model';

const KEY = 'ledger.notes.v1';
const MAX_NOTES = 200;
export const MAX_NOTE_CHARS = 4000;

/** `deletedAt` is a soft delete: the record stays in storage and is filtered out of `NotesState.notes`. */
export interface Note { id: string; title: string; body: string; createdAt: number; updatedAt: number; deletedAt: number | null }
export interface NotesState { notes: Note[]; ok: boolean }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

function validNote(v: unknown): Note | null {
  if (!isRecord(v) || typeof v.id !== 'string') return null;
  return {
    id: v.id,
    title: str(v.title, 120),
    body: str(v.body, MAX_NOTE_CHARS),
    createdAt: num(v.createdAt),
    updatedAt: num(v.updatedAt),
    deletedAt: typeof v.deletedAt === 'number' && Number.isFinite(v.deletedAt) ? v.deletedAt : null,
  };
}

const live = (all: Note[]) => all.filter((n) => n.deletedAt === null);

function load(): { all: Note[]; ok: boolean } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { all: [], ok: true };
    const parsed: unknown = JSON.parse(raw);
    const list = isRecord(parsed) && Array.isArray(parsed.notes) ? parsed.notes : [];
    return { all: list.map(validNote).filter((n): n is Note => n !== null).slice(0, MAX_NOTES), ok: true };
  } catch {
    return { all: [], ok: false };
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

const initial = load();
let all: Note[] = initial.all;
let state: NotesState = { notes: live(all), ok: initial.ok };
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const snapshot = () => state;

function set(next: Note[]) {
  // Trim from the oldest deleted records first so a full store never evicts a live note.
  const deleted = next.filter((n) => n.deletedAt !== null).sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
  const kept = live(next);
  all = [...kept, ...deleted.slice(0, Math.max(0, MAX_NOTES - kept.length))];
  state = { notes: kept, ok: save(all) };
  listeners.forEach((l) => l());
}

export const useNotes = () => useSyncExternalStore(subscribe, snapshot, snapshot);

export function addNote(): Note {
  const now = Date.now();
  const note: Note = { id: newId(), title: '', body: '', createdAt: now, updatedAt: now, deletedAt: null };
  set([note, ...all]);
  return note;
}

export const updateNote = (id: string, patch: Partial<Pick<Note, 'title' | 'body'>>) =>
  set(all.map((n) => (n.id === id ? { ...n, ...patch, title: (patch.title ?? n.title).slice(0, 120), body: (patch.body ?? n.body).slice(0, MAX_NOTE_CHARS), updatedAt: Date.now() } : n)));

/** Soft delete: hides the note; the record stays in this browser's store. */
export const removeNote = (id: string) => set(all.map((n) => (n.id === id ? { ...n, deletedAt: Date.now() } : n)));
