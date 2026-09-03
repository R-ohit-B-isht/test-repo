import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import type { Zone } from '../../lib/types';
import { scoreClass, verdict } from '../../lib/format';

export function ZoneBadge({ zone, className }: { zone: Zone | 'unstated'; className?: string }) {
  const label = { face: 'Face', body: 'Body', both: 'Face + body', unstated: 'Scope not stated' }[zone];
  return (
    <span className={clsx('label inline-flex items-center gap-1.5', zone !== 'unstated' ? `zone-${zone}` : 'text-muted', className)}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

/** Booking-style solid score badge with the verdict word beside it. */
export function ScoreBadge({ score, size, showVerdict = true, className }: { score: number; size?: 'lg'; showVerdict?: boolean; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2', className)}>
      <span className={scoreClass(score, size)} aria-label={`Score ${score.toFixed(1)} out of 100`}>{score.toFixed(1)}</span>
      {showVerdict && <span className={clsx('font-bold text-primary', size === 'lg' ? 'text-[15px]' : 'text-[13px]')}>{verdict(score)}</span>}
    </span>
  );
}

export function ScoreBar({ label, value, max = 10, hint }: { label: string; value: number; max?: number; hint?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5" title={hint}>
      <span className="label truncate">{label}</span>
      <span className="mono text-[13px] font-bold text-primary">{value.toFixed(1)}</span>
      <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-raised" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx('label flex items-center gap-2 !text-accent', className)}><span className="dot" aria-hidden />{children}</p>;
}

/** Empty / loading / error block: one line of explanation and at most one action (curated empty-state guidance). */
export function StatusBlock({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card fade-in mx-auto my-16 max-w-md p-8 text-center" role="status">
      <p className="text-[20px] font-extrabold text-display">{title}</p>
      {body && <p className="mt-2 text-[14px] text-secondary">{body}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx('animate-pulse rounded-lg bg-raised', className)} />;
}

/** Section heading row used across home, hub and category pages: title + optional sub-line, meta on the right. */
export function SectionHead({ id, title, sub, meta, tone }: { id: string; title: string; sub?: string; meta?: ReactNode; tone?: string }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 id={id} className={clsx('text-[22px] sm:text-[26px]', tone)}>{title}</h2>
        {sub && <p className="mt-1 max-w-2xl text-[14px] text-secondary">{sub}</p>}
      </div>
      {meta && <div className="label shrink-0">{meta}</div>}
    </div>
  );
}
