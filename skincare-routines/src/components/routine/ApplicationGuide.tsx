import { ChevronDown, ExternalLink, MapPin } from 'lucide-react';
import { ApplicationMap } from './ApplicationMap';
import { applicationGuide, type GuidedStep } from '../../schedule/application';

interface Props { step: GuidedStep; defaultOpen?: boolean }

const FROM_LABEL = { category: 'Read from the step’s category', title: 'Read from the step’s name (no category set)', zone: 'Read from the step’s zone only' } as const;

/** Tappable "Where to apply" row → schematic + placement notes. Derived on the fly from the saved step; nothing is stored. */
export function ApplicationGuide({ step, defaultOpen = false }: Props) {
  const g = applicationGuide(step);
  return (
    <details className="apply-guide" open={defaultOpen || undefined}>
      <summary aria-label={`Where to apply: ${g.label}`}>
        <MapPin size={13} className="text-accent" aria-hidden />
        <span className="min-w-0 flex-1 text-left leading-snug">Where to apply · <span className="text-secondary">{g.label}</span></span>
        <ChevronDown size={14} className="sched-chev shrink-0 text-secondary" aria-hidden />
      </summary>
      <div className="mt-3 grid gap-4 rounded-[12px] border border-line bg-raised/40 p-4 sm:grid-cols-[200px_1fr]">
        <figure className="m-0">
          <ApplicationMap area={g.area} label={g.label} excludeNoseCorners={g.excludeNoseCorners} />
          <figcaption className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold text-secondary">
            <span className="inline-flex items-center gap-1.5"><i className="app-legend-on inline-block h-3 w-3 rounded-sm" aria-hidden />Apply</span>
            <span className="inline-flex items-center gap-1.5"><i className="app-legend-off inline-block h-3 w-3 rounded-sm" aria-hidden />Keep clear</span>
            <span>Schematic · not to scale</span>
          </figcaption>
        </figure>
        <dl className="m-0 min-w-0 space-y-3 text-[13px] leading-relaxed">
          <div><dt className="label">Apply to</dt><dd className="m-0 mt-0.5 text-primary">{g.apply}</dd></div>
          <div><dt className="label">Keep clear</dt><dd className="m-0 mt-0.5 text-primary">{g.avoid}</dd></div>
          <div><dt className="label">How</dt><dd className="m-0 mt-0.5 text-primary">{g.method}</dd></div>
          <div>
            <dt className="label">Basis</dt>
            <dd className="m-0 mt-0.5 text-[12px] text-secondary">
              {g.basis} {FROM_LABEL[g.from]}.
              {g.source && (
                <> <a href={g.source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-accent underline-offset-2 hover:underline">{g.source.label}<ExternalLink size={11} aria-hidden /></a></>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </details>
  );
}
