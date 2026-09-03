import { ExternalLink } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { ScoreBadge, ScoreBar } from '../ui/primitives';
import { PhaseBadge } from './PhaseBadge';
import type { Routine, RoutineStep } from '../../lib/types';
import { ROUTINE_CATEGORIES, ROUTINE_CRITERIA, ROUTINE_WEIGHTS } from '../../domain/routines';

interface Props { r: Routine | null; rank: number; onClose: () => void }

export function RoutineSheet({ r, rank, onClose }: Props) {
  return (
    <Sheet open={!!r} onClose={onClose} title={r ? `${r.brand} — ${r.model}` : ''}>
      {r && (
        <div className="space-y-6">
          <header className="card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono rounded-full bg-raised px-2.5 py-1 text-[12px] font-extrabold text-display">#{rank}</span>
              <span className="label">{ROUTINE_CATEGORIES[r.category]?.label ?? r.category}</span>
            </div>
            <p className="mt-3 text-[13px] font-bold text-accent">{r.brand} · {r.author}</p>
            <h2 className="mt-1 text-[22px] leading-tight text-display">{r.model}</h2>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <ScoreBadge score={r.score} size="lg" />
              <span className="text-[13px] text-secondary"><span className="font-bold text-display">{r.stepsPerDay}</span> steps/day · <span className="font-bold text-display">{r.timePerDay}</span></span>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-primary">{r.highlight}</p>
          </header>

          <section className="card p-5">
            <h3 className="text-[15px] font-extrabold text-display">Score breakdown</h3>
            <div className="mt-4 space-y-4">
              {ROUTINE_CRITERIA.map((c) => <ScoreBar key={c.key} label={`${c.label} · ${Math.round(ROUTINE_WEIGHTS[c.key] * 100)}%`} value={r.scores[c.key] ?? 0} hint={c.hint} />)}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-[15px] font-extrabold text-display">Step by step — what to do, when</h3>
            <StepList title="Morning" steps={r.steps.morning} />
            <StepList title="Evening" steps={r.steps.evening} />
            <StepList title="Weekly" steps={r.steps.weekly} />
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="card p-5"><h3 className="text-[14px] font-extrabold text-success">For</h3><ul className="mt-3 space-y-2 text-[13px] text-primary">{r.pros.map((p) => <li key={p} className="flex gap-2"><span className="font-extrabold text-success">+</span>{p}</li>)}</ul></div>
            <div className="card p-5"><h3 className="text-[14px] font-extrabold text-warning">Against</h3><ul className="mt-3 space-y-2 text-[13px] text-primary">{r.cons.map((c) => <li key={c} className="flex gap-2"><span className="font-extrabold text-warning">−</span>{c}</li>)}</ul></div>
          </section>

          <section className="card p-5">
            <h3 className="text-[15px] font-extrabold text-display">At a glance</h3>
            <dl className="mt-3 divide-y divide-line text-[13px]">
              {Object.entries(r.fullSpec).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(110px,35%)_1fr] gap-3 py-2.5"><dt className="text-secondary">{k}</dt><dd className="font-semibold text-display">{v}</dd></div>
              ))}
            </dl>
          </section>

          <div className="flex flex-wrap gap-2">
            <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-accent h-12 flex-1 no-underline">Source: {r.source} <ExternalLink size={14} /></a>
            {r.sourceUrl2 && <a href={r.sourceUrl2} target="_blank" rel="noopener noreferrer" className="btn h-12 flex-1 no-underline">Second source <ExternalLink size={14} /></a>}
          </div>
        </div>
      )}
    </Sheet>
  );
}

function StepList({ title, steps }: { title: string; steps: RoutineStep[] }) {
  if (!steps.length) return null;
  return (
    <div className="mb-4">
      <p className="label mb-2 !text-accent">{title}</p>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={`${s.name}-${i}`} className="card grid grid-cols-[auto_1fr] gap-3 p-4">
            <span className="mono flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-[12px] font-extrabold text-accent">{i + 1}</span>
            <div>
              <div className="flex flex-wrap items-center gap-2"><span className="text-[14px] font-bold text-display">{s.name}</span><PhaseBadge phase={s.phase} /></div>
              <p className="mt-1 text-[13px] leading-relaxed text-secondary">{s.how}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
