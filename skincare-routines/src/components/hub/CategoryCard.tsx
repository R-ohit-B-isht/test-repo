import { ArrowRight } from 'lucide-react';
import { AppLink } from '../ui/AppLink';
import { ZoneBadge } from '../ui/primitives';
import type { CategoryMeta } from '../../lib/types';

/** Discovery tile: zone-tinted top band with the listing count, then label + blurb (Airbnb category tiles / Headspace content cards). */
export function CategoryCard({ cat }: { cat: CategoryMeta }) {
  const { face, body, both, unstated } = cat.byScope;
  const total = Math.max(1, cat.count);
  const band = cat.kicker === 'PROTOCOL' ? 'bg-accent-soft' : cat.zone === 'body' ? 'bg-body/10' : cat.zone === 'both' ? 'bg-both/10' : 'bg-face/10';
  return (
    <AppLink to={`/c/${cat.id}`} className="card card-hover press group flex h-full flex-col overflow-hidden no-underline">
      <div className={`flex items-start justify-between gap-3 px-5 pb-4 pt-5 ${band}`}>
        <div>
          <span className="mono block text-[28px] font-extrabold leading-none text-display">{cat.count.toLocaleString('en-IN')}</span>
          <span className="label mt-1 block">listings</span>
        </div>
        <ZoneBadge zone={cat.zone} className="!bg-surface rounded-full px-2.5 py-1" />
      </div>
      <div className="flex flex-1 flex-col p-5 pt-4">
        <span className="label">{cat.kicker}</span>
        <h3 className="mt-1 text-[20px] leading-tight text-display">{cat.label}</h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-secondary">{cat.blurb}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-raised" aria-label={`Face ${face}, body ${body}, face and body ${both}, scope not stated ${unstated}`} role="img">
            <span className="bg-face" style={{ width: `${(face / total) * 100}%` }} />
            <span className="bg-both" style={{ width: `${(both / total) * 100}%` }} />
            <span className="bg-body" style={{ width: `${(body / total) * 100}%` }} />
          </div>
          <span className="flex items-center gap-1 text-[13px] font-bold text-accent">Open<ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden /></span>
        </div>
      </div>
    </AppLink>
  );
}
