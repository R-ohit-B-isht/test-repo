import { clsx } from 'clsx';
import type { EvidenceStatus } from '../../lib/types';
import { EVIDENCE_META } from '../../domain/scoreMeta';

interface Props { evidence: Record<EvidenceStatus, number>; total: number; selected: string[]; onToggle: (tag: string) => void }

const ORDER: EvidenceStatus[] = ['official', 'listing', 'claimed', 'none'];
const BAR: Record<EvidenceStatus, string> = { official: 'bg-success', listing: 'bg-accent', claimed: 'bg-warning', none: 'bg-line-strong' };

/** How much of the category is actually verifiable: a stacked bar of evidence tiers, each segment a toggle for the `ev:` facet. */
export function EvidenceStrip({ evidence, total, selected, onToggle }: Props) {
  if (total === 0) return null;
  return (
    <section className="mt-6" aria-label="Evidence coverage">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-raised" role="img" aria-label={ORDER.map((k) => `${EVIDENCE_META[k].short}: ${evidence[k]}`).join(', ')}>
        {ORDER.map((k) => evidence[k] > 0 && <span key={k} className={BAR[k]} style={{ width: `${(evidence[k] / total) * 100}%` }} />)}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {ORDER.map((k) => {
          const tag = `ev:${k}`;
          const on = selected.includes(tag);
          return (
            <li key={k}>
              <button type="button" aria-pressed={on} onClick={() => onToggle(tag)} title={EVIDENCE_META[k].label}
                className={clsx('inline-flex items-center gap-1.5 rounded-full px-1.5 py-0.5 text-[12px] font-bold text-secondary hover:text-display', on && 'bg-raised text-display ring-1 ring-line-strong')}>
                <span className={clsx('h-2 w-2 rounded-full', BAR[k])} aria-hidden />
                {EVIDENCE_META[k].short}
                <span className="mono font-extrabold text-display">{evidence[k].toLocaleString('en-IN')}</span>
                <span className="text-muted">{Math.round((evidence[k] / total) * 100)}%</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
