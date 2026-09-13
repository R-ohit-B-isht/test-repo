import { MessageSquareText, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import type { ConversationSummary } from '../../chat/history/model';
import { relativeTime } from '../../chat/history/model';

interface Props { items: ConversationSummary[]; activeId: string | null; storageOk: boolean; onOpen: (id: string) => void; onDelete: (id: string) => void }

/** Saved conversations on this device (ChatGPT / Perplexity library pattern): newest first, tap to reopen, delete per row. */
export function HistoryList({ items, activeId, storageOk, onOpen, onDelete }: Props) {
  return (
    <div className="flex h-full flex-col">
      <h2 className="text-[15px] font-extrabold tracking-tight text-display">Chat history</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-secondary">
        {storageOk ? 'Saved only in this browser — nothing leaves your device.' : 'This browser is not letting the site save history (private mode or storage full), so chats last only until this tab closes.'}
      </p>
      {items.length === 0 ? (
        <p className="mt-8 flex items-center gap-2 text-[13px] text-muted"><MessageSquareText size={14} aria-hidden /> No saved chats yet — ask anything and it will appear here.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-y border-line" aria-label="Saved conversations">
          {items.map((c) => (
            <li key={c.id} className={clsx('flex items-stretch gap-1', c.id === activeId && 'bg-accent-soft/40')}>
              <button type="button" onClick={() => onOpen(c.id)} aria-current={c.id === activeId ? 'true' : undefined}
                className="group flex min-w-0 flex-1 flex-col items-start gap-0.5 py-2.5 pl-1 text-left">
                <span className="w-full truncate text-[13.5px] font-semibold leading-snug text-primary group-hover:text-accent">{c.title}</span>
                <span className="label text-[11px] text-muted">{c.turns} {c.turns === 1 ? 'question' : 'questions'} · {relativeTime(c.updatedAt)}</span>
              </button>
              <button type="button" onClick={() => onDelete(c.id)} className="btn my-1.5 h-9 w-9 shrink-0 self-center px-0 text-muted hover:text-danger" aria-label={`Delete chat: ${c.title}`} title="Delete">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
