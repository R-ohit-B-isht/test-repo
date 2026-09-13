import { useEffect, useRef, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import type { InciSourceKind, InciStatus, PlaceTag, Zone } from '../../lib/types';
import { scoreClass, usePrefersReducedMotion, verdict } from '../../lib/format';
import { INCI_META, INCI_SOURCE_META, PLACE_META } from '../../domain/scoreMeta';

export function ZoneBadge({ zone, className }: { zone: Zone | PlaceTag; className?: string }) {
  const meta = PLACE_META[zone];
  return (
    <span className={clsx('label inline-flex items-center gap-1.5', meta.tone, className)}>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
      {meta.label}
    </span>
  );
}

/** What the score was read from: a verified INCI list (and where it was read, if not the listing), or an explicit
 *  "unscored" state. Never hides a missing list. */
export function EvidenceBadge({ status, source, className }: { status: InciStatus; source?: InciSourceKind; className?: string }) {
  const meta = INCI_META[status];
  const src = status === 'full' && source && source !== 'listing' ? INCI_SOURCE_META[source] : null;
  const tone = { good: 'text-success', warn: 'text-warning', muted: 'text-muted' }[meta.tone];
  const title = src ? `${meta.label} — ${src.label}` : meta.label;
  return (
    <span className={clsx('label inline-flex items-center gap-1', tone, className)} title={title}>
      {meta.tone === 'good' ? <ShieldCheck size={11} aria-hidden /> : <ShieldAlert size={11} aria-hidden />}
      {meta.short}
      {src && <span className="font-medium normal-case tracking-normal text-secondary">· {src.short}</span>}
      <span className="sr-only"> — {title}</span>
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

const RING_ALPHA = [1, 0.75, 0.5, 0.3];

/**
 * Score composition ring (MyFitnessPal nutrition ring / Screenroom progress-ring): one arc per dimension, arc length = weight,
 * filled portion = that dimension's score out of 10. The filled arcs therefore add up to the total score visually.
 */
export function ScoreRing({ total, parts, size = 120 }: { total: number; parts: { label: string; weight: number; value: number }[]; size?: number }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const gap = 3;
  const arcs = parts.map((p, i) => {
    const start = parts.slice(0, i).reduce((acc, q) => acc + c * q.weight, 0);
    const len = Math.max(0, c * p.weight - gap);
    const fill = len * Math.max(0, Math.min(1, p.value / 10));
    return { ...p, len, fill, start, alpha: RING_ALPHA[i % RING_ALPHA.length] };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Score ${total.toFixed(1)} of 100: ${parts.map((p) => `${p.label} ${p.value.toFixed(1)} of 10`).join(', ')}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {arcs.map((a) => (
          <g key={a.label}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-raised)" strokeWidth={stroke}
              strokeDasharray={`${a.len} ${c - a.len}`} strokeDashoffset={-a.start} strokeLinecap="butt" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-accent)" strokeOpacity={a.alpha} strokeWidth={stroke}
              strokeDasharray={`${a.fill} ${c - a.fill}`} strokeDashoffset={-a.start} strokeLinecap="butt" className="ring-arc" />
          </g>
        ))}
      </g>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="mono fill-[var(--color-display)] text-[26px] font-extrabold">{total.toFixed(1)}</text>
    </svg>
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

/** Booking "search loading" state: ghost rows in the exact shape of a ranked ProductCard, so nothing jumps when data lands. */
export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading listings">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-3 p-3 sm:grid-cols-[40px_72px_minmax(0,1fr)_auto_auto] sm:gap-x-4 sm:p-4" style={{ opacity: 1 - i * 0.12 }}>
          <Skeleton className="mx-auto h-5 w-5" />
          <Skeleton className="h-[80px] w-[64px] sm:h-[88px] sm:w-[72px]" />
          <div className="space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-3/5" /></div>
          <Skeleton className="hidden h-9 w-12 sm:block" />
          <Skeleton className="hidden h-9 w-9 rounded-full sm:block" />
        </div>
      ))}
      <span className="sr-only">Loading listings…</span>
    </div>
  );
}

/** Screenroom status-badge: pulsing dot + when the data was captured (real manifest timestamp, never a live claim). */
export function LiveDataBadge({ capturedAt, className }: { capturedAt: string; className?: string }) {
  const d = new Date(capturedAt);
  const when = Number.isNaN(d.getTime()) ? capturedAt.slice(0, 10) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <span className={clsx('inline-flex h-7 items-center gap-2 rounded-full border border-line bg-surface px-2.5 text-[12px] font-bold text-secondary', className)}>
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
      </span>
      Real listings · captured {when}
    </span>
  );
}

/** Screenroom number-ticker: counts up once when scrolled into view; static under reduced motion. Only ever fed real counts. */
export function NumberTicker({ value, duration = 900, className }: { value: number; duration?: number; className?: string }) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (reduced || !el) { setShown(value); return; }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min((t - t0) / duration, 1);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration, reduced]);
  return <span ref={ref} className={clsx('mono', className)}>{shown.toLocaleString('en-IN')}</span>;
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
