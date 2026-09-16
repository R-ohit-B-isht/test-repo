import type { ReactNode } from 'react';
import { Check, ChevronDown, ChevronUp, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { ApplicationGuide } from './ApplicationGuide';
import { ProductSnippet } from './ProductSnippet';
import { daysSummary, ZONE_LABEL, type Step } from '../../schedule/model';

interface Props {
  step: Step;
  index: number;
  count: number;
  categoryLabel: (id: string) => string;
  onEdit: () => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  /** Ticked off for the day being viewed; the tick lives in its own journal, not on the step. */
  done?: boolean;
  onToggleDone?: () => void;
}

/** One accepted step on the timeline (Headspace routine card): number, name, where / when, the real listing if one is pinned,
 * plus a derived "Where to apply" guide — computed from the saved step every render, so old routines get it without a redo. */
export function StepCard({ step, index, count, categoryLabel, onEdit, onRemove, onMove, done = false, onToggleDone }: Props) {
  return (
    <li className={clsx('card fade-in p-4', done && 'sched-done')}>
      <div className="flex items-start gap-3">
        {onToggleDone ? (
          <button type="button" className="sched-check press shrink-0" aria-pressed={done} onClick={onToggleDone} aria-label={`${done ? 'Undo' : 'Mark'} ${step.title} done today`}>
            <Check size={15} strokeWidth={3} aria-hidden />
          </button>
        ) : (
          <span className="mono flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-extrabold text-page" aria-hidden>{index + 1}</span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {onToggleDone && <span className="mono text-[11px] font-bold text-muted" aria-hidden>{index + 1}</span>}
            <h4 className="text-[15px] font-extrabold text-display">{step.title}</h4>
            {step.origin === 'ai' && <span className="label inline-flex items-center gap-1 text-accent" title="Proposed by the assistant, accepted by you"><Sparkles size={11} aria-hidden />Assistant</span>}
          </div>
          <p className="mt-0.5 text-[12px] font-semibold text-secondary">
            {ZONE_LABEL[step.zone]} · {daysSummary(step.days)}{step.category ? ` · ${categoryLabel(step.category)}` : ''}
          </p>
          {step.note && <p className="mt-2 text-[13px] leading-relaxed text-primary">{step.note}</p>}
          {step.product && <div className="mt-3"><ProductSnippet product={step.product} categoryLabel={categoryLabel} /></div>}
          <div className="mt-3"><ApplicationGuide step={step} /></div>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-0.5 sm:flex-row" role="group" aria-label={`Actions for ${step.title}`}>
          <IconBtn label="Move up" onClick={() => onMove(-1)} disabled={index === 0}><ChevronUp size={15} /></IconBtn>
          <IconBtn label="Move down" onClick={() => onMove(1)} disabled={index === count - 1}><ChevronDown size={15} /></IconBtn>
          <IconBtn label="Edit step" onClick={onEdit}><Pencil size={14} /></IconBtn>
          <IconBtn label="Remove step" onClick={onRemove} danger><Trash2 size={14} /></IconBtn>
        </div>
      </div>
    </li>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className={clsx('press flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-raised hover:text-display disabled:opacity-30 disabled:hover:bg-transparent', danger && 'hover:text-danger')}>
      {children}
    </button>
  );
}
