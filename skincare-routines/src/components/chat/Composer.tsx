import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { clsx } from 'clsx';

interface Props { busy: boolean; onSend: (text: string) => void; onStop: () => void; autoFocus: boolean; hint: string }

/** Perplexity "Ask anything…" composer: Enter sends, Shift+Enter breaks a line, the send button becomes Stop while streaming (Yelp 74 / Perplexity 13). */
export function Composer({ busy, onSend, onStop, autoFocus, hint }: Props) {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (autoFocus) requestAnimationFrame(() => ref.current?.focus()); }, [autoFocus]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

  const submit = () => {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t);
    setText('');
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
  };
  const canSend = !!text.trim() && !busy;
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex items-end gap-2 rounded-[18px] border border-line-strong bg-surface p-1.5 pl-3.5 focus-within:border-secondary">
      <textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} rows={1}
        placeholder="Ask about any listing, rank, INCI or category…" aria-label="Ask the assistant"
        className="max-h-[140px] min-h-[24px] flex-1 resize-none bg-transparent py-1.5 text-[14px] leading-snug text-primary outline-none placeholder:text-muted" />
      {busy ? (
        <button type="button" onClick={onStop} className="btn btn-primary h-9 w-9 shrink-0 px-0" aria-label="Stop generating"><Square size={12} fill="currentColor" /></button>
      ) : (
        <button type="submit" disabled={!canSend} className={clsx('btn h-9 w-9 shrink-0 px-0 transition-colors', canSend ? 'btn-accent' : 'opacity-40')} aria-label="Send"><ArrowUp size={15} /></button>
      )}
      <span className="sr-only">{hint}</span>
    </form>
  );
}
