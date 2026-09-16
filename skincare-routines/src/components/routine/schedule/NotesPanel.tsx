import { Lock, Plus, Trash2 } from 'lucide-react';
import { addNote, MAX_NOTE_CHARS, removeNote, updateNote, useNotes, type Note } from '../../../schedule/notesStore';

/** Internal notes: private scratch space on this device. Kept apart from the routine and from product evidence, and
 * never handed to the assistant — the panel says so instead of letting anyone assume otherwise. */
export function NotesPanel() {
  const { notes, ok } = useNotes();
  return (
    <section aria-label="Internal notes">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">Internal notes</p>
          <h3 className="mt-1 text-[22px] leading-tight text-display sm:text-[26px]">Your notes, for you.</h3>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-secondary"><Lock size={12} aria-hidden />Saved only in this browser. Not evidence, not sent to the assistant.</p>
        </div>
        <button type="button" className="btn btn-accent" onClick={() => addNote()}><Plus size={14} aria-hidden />New note</button>
      </div>
      {!ok && <p className="mt-3 rounded-[12px] border border-warning/40 bg-warning/10 px-3 py-2 text-[13px] text-primary">This browser refused to save — notes will vanish when the tab closes.</p>}
      {notes.length === 0 ? (
        <div className="mt-4 rounded-[16px] border border-dashed border-line-strong px-5 py-8 text-center">
          <p className="text-[14px] font-bold text-display">Nothing written yet</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-secondary">Reactions, purge dates, what to ask the dermatologist, when a bottle was opened.</p>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {notes.map((n) => <NoteCard key={n.id} note={n} />)}
        </ul>
      )}
    </section>
  );
}

const when = (t: number) => new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

function NoteCard({ note }: { note: Note }) {
  return (
    <li className="card flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2">
        <input value={note.title} onChange={(e) => updateNote(note.id, { title: e.target.value })} placeholder="Title" aria-label="Note title" maxLength={120}
          className="min-w-0 flex-1 bg-transparent text-[15px] font-extrabold text-display placeholder:text-muted focus:outline-none" />
        <button type="button" onClick={() => removeNote(note.id)} aria-label="Delete note" title="Delete note"
          className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-secondary hover:bg-raised hover:text-danger"><Trash2 size={14} /></button>
      </div>
      <textarea value={note.body} onChange={(e) => updateNote(note.id, { body: e.target.value })} placeholder="Write anything…" aria-label="Note" rows={5} maxLength={MAX_NOTE_CHARS}
        className="field min-h-[120px] w-full resize-y text-[14px] leading-relaxed" />
      <p className="mono text-[11px] text-muted">Edited {when(note.updatedAt)}{note.body.length > MAX_NOTE_CHARS - 200 ? ` · ${MAX_NOTE_CHARS - note.body.length} left` : ''}</p>
    </li>
  );
}
