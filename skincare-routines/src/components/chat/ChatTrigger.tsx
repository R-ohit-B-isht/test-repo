import { useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { openChat, toggleChat, useChat } from '../../chat/chatStore';

/** Header entry point for the assistant. `?` (outside inputs) toggles it, matching the ⌘K / `/` palette shortcuts. */
export function ChatTrigger() {
  const { open, busy } = useChat();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest('input, textarea, [contenteditable]');
      if (e.key === '?' && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); toggleChat(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <button type="button" onClick={openChat} aria-expanded={open} aria-haspopup="dialog"
      className="btn btn-accent h-9 shrink-0 gap-1.5 px-3 text-[13px] sm:h-10 sm:px-4" title="Ask the Ledger (?)">
      <Sparkles size={14} className={busy ? 'chat-pulse' : undefined} aria-hidden />
      <span>Ask</span>
      <kbd className="mono hidden rounded border border-[color-mix(in_srgb,var(--accent-ink)_35%,transparent)] px-1 text-[10px] font-bold opacity-80 md:inline">?</kbd>
    </button>
  );
}
