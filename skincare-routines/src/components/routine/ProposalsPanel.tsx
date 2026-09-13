import { AlertTriangle, Check, Pencil, Sparkles, X } from 'lucide-react';
import { clsx } from 'clsx';
import { ProductSnippet } from './ProductSnippet';
import type { FillState } from '../../schedule/scheduleStore';
import { daysSummary, SLOT_LABEL, ZONE_LABEL, type Proposal } from '../../schedule/model';

interface Props {
  proposals: Proposal[];
  fill: FillState;
  categoryLabel: (id: string) => string;
  onAccept: (id: string) => void;
  onEdit: (p: Proposal) => void;
  onReject: (id: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onClearDecided: () => void;
  onRetry: () => void;
  onDismiss: () => void;
}

/** The assistant's written summary, minus citation markers (the products themselves are on the cards below). */
const plain = (text: string) => text.replace(/\[\[[^\]]*\]\]?/g, '').replace(/\*\*/g, '').replace(/[ \t]{2,}/g, ' ').trim();

/** Pending proposals (Todoist inbox-style list): each card is Accept / Edit / Reject; nothing here is on the routine yet. */
export function ProposalsPanel({ proposals, fill, categoryLabel, onAccept, onEdit, onReject, onAcceptAll, onRejectAll, onClearDecided, onRetry, onDismiss }: Props) {
  const pending = proposals.filter((p) => p.status === 'pending');
  const decided = proposals.length - pending.length;
  const running = fill.phase === 'running';
  const show = running || fill.phase === 'error' || pending.length > 0 || (fill.phase === 'done' && (fill.note || fill.problems.length));
  if (!show) return null;
  return (
    <section className="card overflow-hidden" aria-labelledby="proposals-head" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-raised/50 px-5 py-3">
        <h3 id="proposals-head" className="flex items-center gap-2 text-[15px] font-extrabold text-display">
          <Sparkles size={15} className="text-accent" aria-hidden />
          {running ? 'Assistant is proposing…' : pending.length ? `${pending.length} pending proposal${pending.length === 1 ? '' : 's'}` : 'Assistant'}
        </h3>
        {pending.length > 1 && !running && (
          <div className="flex gap-1.5">
            <button type="button" className="btn h-9" onClick={onRejectAll}>Reject all</button>
            <button type="button" className="btn btn-primary h-9" onClick={onAcceptAll}>Accept all {pending.length}</button>
          </div>
        )}
      </div>

      <div className="space-y-4 px-5 py-4">
        {running && (
          <p className="flex items-center gap-2 text-[13px] font-semibold text-secondary"><span className="chat-dots" aria-hidden><i /><i /><i /></span>{fill.status || 'Connecting to Gemini…'}</p>
        )}
        {fill.note && <p className="text-[14px] leading-relaxed text-primary">{plain(fill.note)}{running && <span className="chat-caret" aria-hidden />}</p>}
        {fill.error && (
          <div role="alert" className={clsx('flex flex-wrap items-start gap-2 rounded-[12px] border px-3.5 py-3 text-[13px]', fill.error.code === 'aborted' ? 'border-line bg-raised/60 text-secondary' : 'border-danger/40 bg-danger/5 text-primary')}>
            <AlertTriangle size={15} className={clsx('mt-0.5 shrink-0', fill.error.code === 'aborted' ? 'text-muted' : 'text-danger')} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="font-bold">{fill.error.message}</span>
              {fill.error.partial && <span className="text-secondary"> — {fill.proposed ? `${fill.proposed} proposal${fill.proposed === 1 ? '' : 's'} arrived before it stopped and are listed below.` : 'nothing was proposed before it stopped.'}</span>}
              {fill.error.code === 'no-key' && <span className="block text-secondary">The assistant is not configured on this site (no Gemini key), so proposals cannot be generated here. Steps can still be added by hand.</span>}
            </span>
            <span className="flex gap-1.5">
              {fill.error.code !== 'no-key' && <button type="button" className="btn h-8 px-3 text-[12px]" onClick={onRetry}>Try again</button>}
              <button type="button" className="btn h-8 w-8 px-0" onClick={onDismiss} aria-label="Dismiss"><X size={13} /></button>
            </span>
          </div>
        )}
        {fill.problems.length > 0 && (
          <details className="rounded-[12px] border border-dashed border-line px-3.5 py-2 text-[12.5px] text-secondary">
            <summary className="cursor-pointer font-bold text-primary">{fill.problems.length} suggestion{fill.problems.length === 1 ? '' : 's'} refused — not a real listing or malformed</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">{fill.problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </details>
        )}
        {fill.phase === 'done' && !fill.error && pending.length === 0 && fill.proposed === 0 && (
          <p className="text-[13px] text-secondary">The assistant answered without proposing steps. Try again with more detail in your setup, or ask it in the chat.</p>
        )}

        {pending.length > 0 && (
          <ul className="space-y-2.5">
            {pending.map((p) => (
              <ProposalCard key={p.id} p={p} categoryLabel={categoryLabel} onAccept={() => onAccept(p.id)} onEdit={() => onEdit(p)} onReject={() => onReject(p.id)} />
            ))}
          </ul>
        )}
        {decided > 0 && !running && (
          <p className="flex items-center justify-between gap-3 text-[12px] text-muted">
            <span>{decided} earlier proposal{decided === 1 ? '' : 's'} decided.</span>
            <button type="button" className="font-bold text-secondary underline-offset-2 hover:underline" onClick={onClearDecided}>Clear</button>
          </p>
        )}
      </div>
    </section>
  );
}

function ProposalCard({ p, categoryLabel, onAccept, onEdit, onReject }: { p: Proposal; categoryLabel: (id: string) => string; onAccept: () => void; onEdit: () => void; onReject: () => void }) {
  const s = p.step;
  return (
    <li className="fade-in rounded-[14px] border border-accent/40 bg-accent-soft/40 p-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <p className="text-[15px] font-extrabold text-display">{s.title}</p>
        <span className="label">{SLOT_LABEL[s.slot]} · {ZONE_LABEL[s.zone]} · {daysSummary(s.days)}{s.category ? ` · ${categoryLabel(s.category)}` : ''}</span>
      </div>
      {p.why && <p className="mt-1.5 text-[13px] leading-relaxed text-primary">{plain(p.why)}</p>}
      <div className="mt-3">
        {s.product ? <ProductSnippet product={s.product} categoryLabel={categoryLabel} /> : (
          <p className="rounded-[12px] border border-dashed border-line-strong px-3 py-2 text-[12.5px] text-secondary">No listing pinned — {s.category ? 'the assistant found nothing sound enough in this category for your setup' : 'a step without a product'}.</p>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <button type="button" className="btn btn-primary h-9" onClick={onAccept}><Check size={14} aria-hidden />Accept</button>
        <button type="button" className="btn h-9" onClick={onEdit}><Pencil size={13} aria-hidden />Edit</button>
        <button type="button" className="btn h-9" onClick={onReject}><X size={14} aria-hidden />Reject</button>
      </div>
    </li>
  );
}
