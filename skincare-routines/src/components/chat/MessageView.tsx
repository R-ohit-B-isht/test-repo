import { useMemo } from 'react';
import { AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import type { AssistantMessage, Message, ToolCallTrace } from '../../chat/types';
import { citedIds } from '../../chat/markdown';
import { Citations } from './Citations';
import { Markdown, type CiteIndex } from './Markdown';
import { ToolTrace } from './ToolTrace';

interface Props { m: Message; isDev: boolean; onFollowup: (q: string) => void; onRetry: () => void; onNavigate: () => void; isLast: boolean }

export function MessageView({ m, isDev, onFollowup, onRetry, onNavigate, isLast }: Props) {
  if (m.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-[16px] rounded-br-[6px] bg-primary px-3.5 py-2.5 text-[14px] leading-snug text-page">{m.text}</p>
      </div>
    );
  }
  return <AssistantView m={m} isDev={isDev} onFollowup={onFollowup} onRetry={onRetry} onNavigate={onNavigate} isLast={isLast} />;
}

function AssistantView({ m, isDev, onFollowup, onRetry, onNavigate, isLast }: Omit<Props, 'm'> & { m: AssistantMessage }) {
  const cites = useMemo<CiteIndex>(() => ({
    products: new Map((m.citations?.products ?? []).map((p) => [p.id, p])),
    categories: new Map((m.citations?.categories ?? []).map((c) => [c.id, c])),
  }), [m.citations]);
  const cited = useMemo(() => citedIds(m.text), [m.text]);
  const working = m.phase === 'connecting' || m.phase === 'tools' || m.phase === 'writing';
  const shownText = m.phase === 'writing' ? holdOpenCitation(m.text) : m.text;
  return (
    <div className="flex gap-2.5">
      <span className={clsx('mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent', working && 'chat-pulse')} aria-hidden>
        <Sparkles size={13} />
      </span>
      <div className="min-w-0 flex-1 text-[14px] leading-relaxed text-primary">
        {(m.phase === 'connecting' || m.phase === 'tools') && <Thinking tools={m.tools} />}
        {shownText && <Markdown text={shownText} cites={cites} onNavigate={onNavigate} />}
        {m.phase === 'writing' && <span className="chat-caret" aria-hidden />}
        {m.error && (
          <div role="alert" className="mt-2 flex items-start gap-2 rounded-[12px] border border-line bg-surface px-3 py-2.5 text-[13px]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warning" aria-hidden />
            <span className="min-w-0 flex-1 text-secondary">{m.error.message}</span>
            {isLast && m.phase === 'error' && (
              <button type="button" onClick={onRetry} className="btn h-8 shrink-0 gap-1.5 px-3 text-[12px]"><RotateCcw size={12} /> Try again</button>
            )}
          </div>
        )}
        {m.phase === 'done' && m.citations && <Citations citations={m.citations} cited={cited} onNavigate={onNavigate} />}
        {m.phase === 'done' && m.followups.length > 0 && isLast && (
          <ul className="mt-4 divide-y divide-line border-t border-line" aria-label="Follow-up questions">
            {m.followups.map((q) => (
              <li key={q}>
                <button type="button" onClick={() => onFollowup(q)} className="flex w-full items-start gap-2 py-2 text-left text-[13px] font-semibold text-primary hover:text-accent">
                  <span className="text-muted" aria-hidden>↳</span>{q}
                </button>
              </li>
            ))}
          </ul>
        )}
        {isDev && (m.phase === 'done' || m.phase === 'error') && <ToolTrace m={m} />}
      </div>
    </div>
  );
}

/** A citation marker that has not closed yet (`[[cetaphil-itm…`) is held back so raw ids never flash mid-stream. */
const holdOpenCitation = (text: string) => text.replace(/\[\[?[^\]]*$/, '');

/** Task-specific status line (Yelp Assistant "Looking for coffee spots"): names the tool actually running against the site data. */
function Thinking({ tools }: { tools: ToolCallTrace[] }) {
  const last = tools[tools.length - 1];
  return (
    <p className="flex items-center gap-2 text-[13px] font-semibold text-secondary" aria-live="polite">
      <span className="chat-dots" aria-hidden><i /><i /><i /></span>
      {last ? describe(last) : 'Connecting to Gemini…'}
    </p>
  );
}

function describe(t: ToolCallTrace): string {
  const a = t.args;
  const str = (k: string) => (typeof a[k] === 'string' ? (a[k] as string) : '');
  switch (t.name) {
    case 'search_products': return `Searching listings for “${str('query')}”…`;
    case 'get_top_products': return `Reading the ${str('category')} ranking…`;
    case 'get_product': return 'Reading the listing’s evidence…';
    case 'compare_products': return 'Comparing listings…';
    case 'get_reference_ceiling': return `Reading the ${str('category')} reference ceiling…`;
    case 'get_category_filters': return `Reading ${str('category')} filters…`;
    case 'get_scoring_method': return 'Reading the scoring method…';
    case 'get_routines': return 'Reading the routines…';
    case 'list_categories': return 'Listing categories…';
    case 'get_site_overview': return 'Reading the site overview…';
    default: return `Running ${t.name}…`;
  }
}
