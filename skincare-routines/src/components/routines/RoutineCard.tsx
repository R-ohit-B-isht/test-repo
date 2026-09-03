import { memo } from 'react';
import type { Routine } from '../../lib/types';
import { ROUTINE_CATEGORIES, PHASE_ORDER } from '../../domain/routines';
import { verdict } from '../../lib/format';
import { PhaseBadge } from './PhaseBadge';

interface Props { r: Routine; rank: number; onOpen: (id: string) => void }

export const RoutineCard = memo(function RoutineCard({ r, rank, onOpen }: Props) {
  const phases = PHASE_ORDER.filter((p) => r.phases.includes(p));
  return (
    <article className="card card-hover flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="mono text-[12px] text-secondary">#{rank}</span>
        <span className="label">{ROUTINE_CATEGORIES[r.category]?.label ?? r.category}</span>
      </div>
      <button type="button" onClick={() => onOpen(r.id)} className="mt-3 flex-1 text-left" aria-label={`Open ${r.brand} ${r.model}`}>
        <p className="label !text-primary">{r.brand}</p>
        <h3 className="mt-1 text-[17px] leading-snug text-display">{r.model}</h3>
        <p className="mt-2 line-clamp-3 text-[13px] text-secondary">{r.highlight}</p>
      </button>
      <ul className="mt-4 flex flex-wrap gap-1" aria-label="Phases covered">
        {phases.map((p) => <li key={p}><PhaseBadge phase={p} /></li>)}
      </ul>
      <div className="mt-4 flex items-end justify-between border-t border-line pt-3">
        <div>
          <span className="display text-[34px]">{r.score.toFixed(1)}</span>
          <span className="label ml-2">{verdict(r.score)}</span>
        </div>
        <p className="mono text-right text-[11px] text-secondary">{r.stepsPerDay} steps/day<br />{r.timePerDay}</p>
      </div>
      <button type="button" onClick={() => onOpen(r.id)} className="btn mt-3 h-9 w-full">Step-by-step</button>
    </article>
  );
});
