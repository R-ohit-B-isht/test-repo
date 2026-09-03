import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import type { Zone } from '../../lib/types';

export function ZoneBadge({ zone, className }: { zone: Zone | 'unstated'; className?: string }) {
  const label = { face: 'FACE', body: 'BODY', both: 'FACE + BODY', unstated: 'SCOPE NOT STATED' }[zone];
  return (
    <span className={clsx('label inline-flex items-center gap-1.5', zone !== 'unstated' && `zone-${zone}`, className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

export function ScoreBar({ label, value, max = 10, hint }: { label: string; value: number; max?: number; hint?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1" title={hint}>
      <span className="label truncate">{label}</span>
      <span className="mono text-[12px] text-primary tabular-nums">{value.toFixed(1)}</span>
      <div className="col-span-2 h-[3px] overflow-hidden rounded-full bg-line" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx('label flex items-center gap-2', className)}><span className="dot" aria-hidden />{children}</p>;
}

export function StatusBlock({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card fade-in mx-auto my-16 max-w-md p-8 text-center" role="status">
      <p className="text-lg font-light text-display">{title}</p>
      {body && <p className="mt-2 text-sm text-secondary">{body}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx('animate-pulse rounded bg-raised', className)} />;
}
