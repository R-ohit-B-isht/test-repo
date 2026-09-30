import { clsx } from 'clsx';
import { CircleCheck, CircleDashed, TriangleAlert, CircleX } from 'lucide-react';
import type { PackRole, PackSize, SetCover } from '../../lib/types';
import { COVER_META, FIT_META, litres, type CompartmentLoad, type FitStatus } from '../../domain/pack';
import { TIER_META, TONE_TEXT } from '../../domain/scoreMeta';

const FIT_ICON = { fits: CircleCheck, tight: TriangleAlert, over: CircleX, empty: CircleDashed } as const;
const FIT_BAR: Record<FitStatus, string> = { fits: 'bg-success', tight: 'bg-warning', over: 'bg-danger', empty: 'bg-line-strong' };

export function FitBadge({ status, size = 'sm', className }: { status: FitStatus; size?: 'sm' | 'lg'; className?: string }) {
  const meta = FIT_META[status];
  const Icon = FIT_ICON[status];
  return (
    <span className={clsx('inline-flex items-center gap-1.5 font-extrabold', TONE_TEXT[meta.tone], size === 'lg' ? 'text-[16px]' : 'text-[13px]', className)} title={meta.hint}>
      <Icon size={size === 'lg' ? 18 : 14} aria-hidden />{meta.label}
    </span>
  );
}

/** Where the counted size came from, in the same words the evidence panel uses. */
export function SizeTier({ size }: { size: PackSize | null }) {
  if (!size) return <span className={clsx('label', TONE_TEXT.muted)}>no accepted size · not counted</span>;
  const t = TIER_META[size.tier];
  return <span className={clsx('label', TONE_TEXT[t.tone])}>size from {t.short}{size.n > 1 ? ` · ${size.n} pcs (${TIER_META[size.nTier].short})` : ''}</span>;
}

/** Every planner role as a chip: filled when the set's stated contents name a piece for it, dashed when it stays open. */
export function RoleCoverage({ roles, covered, className }: { roles: PackRole[]; covered: Set<string>; className?: string }) {
  return (
    <ul className={clsx('flex flex-wrap gap-1.5', className)} aria-label="Roles covered by this set">
      {roles.map((r) => {
        const on = covered.has(r.id);
        return (
          <li key={r.id} className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold', on ? 'bg-success/10 text-success' : 'border border-dashed border-line-strong text-muted')}>
            {on ? <CircleCheck size={11} aria-hidden /> : <CircleDashed size={11} aria-hidden />}{r.label}
            <span className="sr-only">{on ? ' covered' : ' not covered'}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Where the set's contents were read — the composition is only as trustworthy as its source. */
export function CoverTier({ cover }: { cover: SetCover }) {
  const m = COVER_META[cover.t];
  return <span className={clsx('label', TONE_TEXT[m.tone])}>{m.label}</span>;
}

/**
 * One compartment's budget: a bar to the maker's rated litres, a tick at the conservative usable budget, the counted
 * volume filled in the fit colour. Unsized picks are called out because they take space the bar cannot show.
 */
export function CompartmentGauge({ load }: { load: CompartmentLoad }) {
  const pct = Math.min(100, (load.used / load.rated) * 100);
  const tick = load.compartment.usable * 100;
  return (
    <section className="card p-4 sm:p-5" aria-labelledby={`comp-${load.compartment.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={`comp-${load.compartment.id}`} className="text-[16px] font-extrabold text-display">{load.compartment.label}</h3>
          <p className="mt-0.5 text-[12px] text-secondary">Budget {litres(load.rated)} rated · {litres(load.usable)} usable ({Math.round(load.compartment.usable * 100)} %)</p>
        </div>
        <FitBadge status={load.status} />
      </div>
      <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-raised" role="meter" aria-valuenow={load.used} aria-valuemin={0} aria-valuemax={load.rated}
        aria-label={`${load.compartment.label}: ${litres(load.used)} of ${litres(load.rated)} rated`}>
        <div className={clsx('h-full rounded-full transition-[width] duration-300', FIT_BAR[load.status])} style={{ width: `${pct}%` }} />
        <span className="absolute inset-y-0 w-0.5 bg-display/60" style={{ left: `${tick}%` }} aria-hidden title="Usable budget" />
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-3 text-[13px]">
        <div><dt className="label">Counted</dt><dd className="mono mt-0.5 font-extrabold text-display">{litres(load.used)}</dd></div>
        <div><dt className="label">Left (usable)</dt><dd className={clsx('mono mt-0.5 font-extrabold', load.remainingUsable < 0 ? 'text-warning' : 'text-display')}>{litres(load.remainingUsable)}</dd></div>
        <div><dt className="label">Left (rated)</dt><dd className={clsx('mono mt-0.5 font-extrabold', load.remainingRated < 0 ? 'text-danger' : 'text-display')}>{litres(load.remainingRated)}</dd></div>
      </dl>
      {load.unsized > 0 && (
        <p className="mt-3 flex items-start gap-2 text-[12px] text-warning"><TriangleAlert size={14} className="mt-px shrink-0" aria-hidden />{load.unsized} pick{load.unsized === 1 ? '' : 's'} here state{load.unsized === 1 ? 's' : ''} no accepted size — {load.unsized === 1 ? 'it takes' : 'they take'} room this bar cannot count.</p>
      )}
      <p className="mt-3 text-[12px] leading-snug text-muted">{load.compartment.note}</p>
    </section>
  );
}
