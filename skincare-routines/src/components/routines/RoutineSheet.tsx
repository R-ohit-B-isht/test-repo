import { ExternalLink } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { ScoreBar } from '../ui/primitives';
import { PhaseBadge } from './PhaseBadge';
import type { Routine, RoutineStep } from '../../lib/types';
import { ROUTINE_CATEGORIES, ROUTINE_CRITERIA, ROUTINE_WEIGHTS } from '../../domain/routines';
import { verdict } from '../../lib/format';

interface Props { r: Routine | null; rank: number; onClose: () => void }

export function RoutineSheet({ r, rank, onClose }: Props) {
  return (
    <Sheet open={!!r} onClose={onClose} title={r ? `${r.brand} — ${r.model}` : ''}>
      {r && (
        <div className="space-y-6">
          <header>
            <p className="label">#{rank} · {ROUTINE_CATEGORIES[r.category]?.label ?? r.category}</p>
            <h2 className="mt-1 text-[22px] leading-tight text-display">{r.model}</h2>
            <p className="mt-1 text-[14px] text-secondary">{r.brand} · {r.author}</p>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="display text-[56px] leading-none">{r.score.toFixed(1)}</span>
              <span className="label">{verdict(r.score)} / 100 · {r.stepsPerDay} steps · {r.timePerDay}</span>
            </div>
            <p className="mt-4 text-[14px] text-primary">{r.highlight}</p>
          </header>

          <section>
            <h3 className="label mb-3">Score breakdown</h3>
            <div className="space-y-3">
              {ROUTINE_CRITERIA.map((c) => <ScoreBar key={c.key} label={`${c.label} · ${Math.round(ROUTINE_WEIGHTS[c.key] * 100)}%`} value={r.scores[c.key] ?? 0} hint={c.hint} />)}
            </div>
          </section>

          <section>
            <h3 className="label mb-3">Step by step — what to do, when</h3>
            <StepList title="Morning" steps={r.steps.morning} />
            <StepList title="Evening" steps={r.steps.evening} />
            <StepList title="Weekly" steps={r.steps.weekly} />
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div><h3 className="label mb-2 text-success">For</h3><ul className="space-y-1.5 text-[13px] text-primary">{r.pros.map((p) => <li key={p} className="flex gap-2"><span className="text-success">+</span>{p}</li>)}</ul></div>
            <div><h3 className="label mb-2 text-warning">Against</h3><ul className="space-y-1.5 text-[13px] text-primary">{r.cons.map((c) => <li key={c} className="flex gap-2"><span className="text-warning">−</span>{c}</li>)}</ul></div>
          </section>

          <section>
            <h3 className="label mb-2">At a glance</h3>
            <dl className="divide-y divide-line border-y border-line text-[13px]">
              {Object.entries(r.fullSpec).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(110px,35%)_1fr] gap-3 py-2"><dt className="text-secondary">{k}</dt><dd className="text-primary">{v}</dd></div>
              ))}
            </dl>
          </section>

          <div className="flex flex-wrap gap-2">
            <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary flex-1">Source: {r.source} <ExternalLink size={14} /></a>
            {r.sourceUrl2 && <a href={r.sourceUrl2} target="_blank" rel="noopener noreferrer" className="btn flex-1">Second source <ExternalLink size={14} /></a>}
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
      <p className="label mb-2 !text-primary">{title}</p>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={`${s.name}-${i}`} className="grid grid-cols-[auto_1fr] gap-3 rounded border border-line bg-raised/50 p-3">
            <span className="mono pt-0.5 text-[11px] text-muted">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <div className="flex flex-wrap items-center gap-2"><PhaseBadge phase={s.phase} /><span className="text-[14px] text-display">{s.name}</span></div>
              <p className="mt-1 text-[13px] text-secondary">{s.how}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
