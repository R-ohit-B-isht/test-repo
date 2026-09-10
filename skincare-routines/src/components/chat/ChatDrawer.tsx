import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SquarePen } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { useManifest } from '../../data/hooks';
import { clearChat, closeChat, retryLast, send, stopChat, useChat } from '../../chat/chatStore';
import { usePage } from '../../chat/pageContext';
import { suggestionsFor } from '../../chat/suggestions';
import { useDevPublish } from '../dev/devStore';
import { Composer } from './Composer';
import { MessageView } from './MessageView';
import { Suggestions } from './Suggestions';

/** Site-wide Gemini drawer. Answers come only from chat-api tools over the same public/data the pages render. */
export function ChatDrawer() {
  const { open, messages, busy } = useChat();
  const page = usePage();
  const manifest = useManifest();
  const [params] = useSearchParams();
  const isDev = params.get('dev') === '1';
  const scroller = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => suggestionsFor(manifest.status === 'ready' ? manifest.data : null, page), [manifest, page]);
  const last = messages[messages.length - 1];
  const lastModel = last?.role === 'model' ? last : null;

  useEffect(() => {
    if (!open) return;
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages]);

  useDevPublish(isDev && open, {
    chatTurns: messages.length, chatBusy: busy, chatPhase: lastModel?.phase ?? '—', chatModel: lastModel?.meta?.model ?? '—',
    chatDataVersion: lastModel?.meta?.dataVersion ?? '—', chatToolCalls: lastModel?.tools.length ?? 0,
    chatUnverified: lastModel?.unverified.length ?? 0, chatPage: page.route,
  });

  const ask = useCallback((q: string) => { void send(q); }, []);
  const contextLine = page.product
    ? `Reading: ${page.product.brand} · #${page.product.rank}`
    : page.category ? `Reading: ${page.category.label}${page.resultCount != null ? ` · ${page.resultCount.toLocaleString('en-IN')} results` : ''}` : 'Reading: whole site';

  return (
    <Sheet open={open} onClose={closeChat} title="Ask the Ledger" narrow bodyClassName="flex min-h-0 flex-1 flex-col"
      headerExtra={messages.length > 0 ? <button type="button" onClick={clearChat} className="btn h-10 w-10 px-0" aria-label="New chat" title="New chat"><SquarePen size={15} /></button> : null}
      footer={
        <div className="space-y-1.5">
          <Composer busy={busy} onSend={ask} onStop={stopChat} autoFocus={open} hint="Enter to send, Shift+Enter for a new line, Escape to close" />
          <p className="label flex items-center justify-between gap-3 px-1 text-[11px] font-semibold text-muted">
            <span className="truncate">{contextLine}</span>
            <span className="shrink-0"><span className="hidden sm:inline">Gemini · </span>answers only from site data</span>
          </p>
        </div>
      }>
      <div ref={scroller} className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {messages.length === 0 ? (
          <Suggestions items={suggestions} onPick={ask} manifest={manifest.status === 'ready' ? manifest.data : null} />
        ) : (
          <div className="space-y-5">
            {messages.map((m, i) => (
              <MessageView key={m.id} m={m} isDev={isDev} isLast={i === messages.length - 1} onFollowup={ask} onRetry={retryLast} onNavigate={closeChat} />
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
