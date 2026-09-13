import { AlertTriangle, Check, Minus } from 'lucide-react';
import { clsx } from 'clsx';
import type { Stage } from '../../../schedule/plannerStore';

/** Todoist onboarding-checklist: each stage ticks off as it finishes, with a real count under it; the running one shows dots. */
export function StageProgress({ stages }: { stages: Stage[] }) {
  return (
    <ol className="space-y-1.5" aria-label="Build progress" aria-live="polite">
      {stages.map((s) => (
        <li key={s.id} className={clsx('flex items-start gap-2.5 text-[13px]', s.status === 'pending' && 'text-muted')}>
          <span className={clsx('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
            s.status === 'done' ? 'border-primary bg-primary text-page' : s.status === 'error' ? 'border-danger text-danger' : s.status === 'skipped' ? 'border-line-strong text-muted' : s.status === 'running' ? 'border-accent' : 'border-line')} aria-hidden>
            {s.status === 'done' && <Check size={10} strokeWidth={3} />}
            {s.status === 'error' && <AlertTriangle size={9} />}
            {s.status === 'skipped' && <Minus size={9} />}
            {s.status === 'running' && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />}
          </span>
          <span className="min-w-0">
            <span className={clsx('font-bold', s.status === 'done' && 'text-primary', s.status === 'running' && 'text-display', s.status === 'error' && 'text-danger')}>{s.label}</span>
            <span className="sr-only">: {s.status}</span>
            {s.detail && <span className="block text-[12px] leading-snug text-secondary">{s.detail}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}
