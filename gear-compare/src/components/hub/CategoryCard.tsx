import { ArrowRight } from 'lucide-react';
import { AppLink } from '../ui/AppLink';
import { FamilyBadge } from '../ui/primitives';
import type { CategoryMeta, EvidenceStatus } from '../../lib/types';
import { EVIDENCE_META, FAMILY_TONE } from '../../domain/scoreMeta';

const EV_ORDER: EvidenceStatus[] = ['official', 'listing', 'claimed', 'none'];
const EV_BAR: Record<EvidenceStatus, string> = { official: 'bg-success', listing: 'bg-accent', claimed: 'bg-warning', none: 'bg-line-strong' };

/** Discovery tile: family-tinted top band with the listing count, then label + blurb, and an evidence-coverage strip —
 *  how much of this category is maker-verified is the first thing a reader should know (Airbnb category tiles / Headspace content cards). */
export function CategoryCard({ cat, familyLabel }: { cat: CategoryMeta; familyLabel: string }) {
  const total = Math.max(1, cat.count);
  const stripLabel = EV_ORDER.map((k) => `${EVIDENCE_META[k].short} ${cat.evidence[k]}`).join(', ');
  return (
    <AppLink to={`/c/${cat.id}`} className="card card-hover press group flex h-full flex-col overflow-hidden no-underline">
      <div className={`flex items-start justify-between gap-3 px-5 pb-4 pt-5 ${FAMILY_TONE[cat.family].band}`}>
        <div>
          <span className="mono block text-[28px] font-extrabold leading-none text-display">{cat.count.toLocaleString('en-IN')}</span>
          <span className="label mt-1 block">listings</span>
        </div>
        <FamilyBadge family={cat.family} label={familyLabel} className="!bg-surface rounded-full px-2.5 py-1" />
      </div>
      <div className="flex flex-1 flex-col p-5 pt-4">
        <span className="label">{cat.kicker}</span>
        <h3 className="mt-1 text-[20px] leading-tight text-display">{cat.label}</h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-secondary">{cat.blurb}</p>
        <p className="mt-3 text-[12px] text-secondary"><span className="font-bold text-success">{cat.evidence.official.toLocaleString('en-IN')}</span> maker-verified · {cat.stores.flipkart.toLocaleString('en-IN')} Flipkart · {cat.stores.amazon.toLocaleString('en-IN')} Amazon</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-raised" aria-label={stripLabel} role="img">
            {EV_ORDER.map((k) => <span key={k} className={EV_BAR[k]} style={{ width: `${(cat.evidence[k] / total) * 100}%` }} />)}
          </div>
          <span className="flex items-center gap-1 text-[13px] font-bold text-accent">Open<ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden /></span>
        </div>
      </div>
    </AppLink>
  );
}
