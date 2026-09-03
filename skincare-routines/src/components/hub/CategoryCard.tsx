import { ArrowUpRight } from 'lucide-react';
import { AppLink } from '../ui/AppLink';
import { ZoneBadge } from '../ui/primitives';
import type { CategoryMeta } from '../../lib/types';

export function CategoryCard({ cat }: { cat: CategoryMeta }) {
  const { face, body, both, unstated } = cat.byScope;
  const total = Math.max(1, cat.count);
  return (
    <AppLink to={`/c/${cat.id}`} className="card card-hover press group flex min-h-[188px] flex-col p-5 no-underline">
      <div className="flex items-start justify-between gap-3">
        <span className="label">{cat.kicker}</span>
        <ArrowUpRight size={16} className="text-muted transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
      </div>
      <h3 className="mt-2 text-[22px] leading-tight text-display">{cat.label}</h3>
      <p className="mt-2 line-clamp-2 text-[13px] text-secondary">{cat.blurb}</p>
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-3">
          <span className="display text-[28px]">{cat.count.toLocaleString('en-IN')}</span>
          <ZoneBadge zone={cat.zone} />
        </div>
        <div className="mt-3 flex h-[3px] w-full overflow-hidden rounded-full bg-line" aria-label={`Face ${face}, body ${body}, face and body ${both}, scope not stated ${unstated}`} role="img">
          <span className="bg-face" style={{ width: `${(face / total) * 100}%` }} />
          <span className="bg-both" style={{ width: `${(both / total) * 100}%` }} />
          <span className="bg-body" style={{ width: `${(body / total) * 100}%` }} />
        </div>
      </div>
    </AppLink>
  );
}
