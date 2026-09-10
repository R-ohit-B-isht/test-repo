import { memo } from 'react';
import { ArrowRight, Clock, Layers } from 'lucide-react';
import type { Routine } from '../../lib/types';
import { ROUTINE_CATEGORIES, PHASE_ORDER } from '../../domain/routines';
import { ScoreBadge } from '../ui/primitives';
import { PhaseBadge } from './PhaseBadge';

interface Props { r: Routine; rank: number; onOpen: (id: string) => void }

/** Fabulous / LifeSum "plan" card: rank + score badge on top, source + name, the phases it covers, and time-cost facts. */
export const RoutineCard = memo(function RoutineCard({ r, rank, onOpen }: Props) {
  const phases = PHASE_ORDER.filter((p) => r.phases.includes(p));
  return (
    <article className="card card-hover flex h-full flex-col p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <span className="mono flex h-8 w-8 items-center justify-center rounded-full bg-raised text-[13px] font-extrabold text-display" aria-label={`Rank ${rank}`}>{rank}</span>
          <span className="label">{ROUTINE_CATEGORIES[r.category]?.label ?? r.category}</span>
        </span>
        <ScoreBadge score={r.score} showVerdict={false} />
      </div>
      <button type="button" onClick={() => onOpen(r.id)} className="mt-4 flex-1 text-left" aria-label={`Open ${r.brand} ${r.model}`}>
        <p className="text-[12px] font-bold text-accent">{r.brand}</p>
        <h3 className="mt-1 text-[19px] leading-snug text-display">{r.model}</h3>
        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-secondary">{r.highlight}</p>
      </button>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Phases covered">
        {phases.map((p) => <li key={p}><PhaseBadge phase={p} /></li>)}
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-secondary">
          <div className="flex items-center gap-1.5"><Layers size={14} aria-hidden /><dt className="sr-only">Steps per day</dt><dd><span className="font-bold text-display">{r.stepsPerDay}</span> steps/day</dd></div>
          <div className="flex items-center gap-1.5"><Clock size={14} aria-hidden /><dt className="sr-only">Time per day</dt><dd className="font-bold text-display">{r.timePerDay}</dd></div>
        </dl>
        <button type="button" onClick={() => onOpen(r.id)} className="btn h-9 px-4">Steps<ArrowRight size={14} aria-hidden /></button>
      </div>
    </article>
  );
});
