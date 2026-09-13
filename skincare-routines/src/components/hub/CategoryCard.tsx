import { ArrowRight } from 'lucide-react';
import { AppLink } from '../ui/AppLink';
import { ZoneBadge } from '../ui/primitives';
import type { CategoryMeta } from '../../lib/types';
import { CONCERN_PARAM, concernCount, concernTag } from '../../domain/concern';

/** Skin concerns picked on the hub: the card counts its matching listings and opens the category with the same filter on. */
export interface ConcernPick { picked: string[]; labels: Record<string, string> }

/** Discovery tile: zone-tinted top band with the listing count, then label + blurb (Airbnb category tiles / Headspace content cards). */
const BAND: Record<CategoryMeta['zone'], string> = { face: 'bg-face/10', both: 'bg-both/10', body: 'bg-body/10', hair: 'bg-hair/10' };

/** Placement strip segments per group; hair uses one hue at three opacities so scalp / lengths read as one family, not face / body. */
const STRIP: Record<CategoryMeta['scopeGroup'], { key: string; label: string; cls: string }[]> = {
  scope: [{ key: 'face', label: 'face', cls: 'bg-face' }, { key: 'both', label: 'face and body', cls: 'bg-both' }, { key: 'body', label: 'body', cls: 'bg-body' }],
  area: [{ key: 'scalp', label: 'scalp', cls: 'bg-hair' }, { key: 'both', label: 'scalp and lengths', cls: 'bg-hair/60' }, { key: 'lengths', label: 'lengths', cls: 'bg-hair/30' }, { key: 'beard', label: 'beard', cls: 'bg-hair' }],
};

export function CategoryCard({ cat, concern }: { cat: CategoryMeta; concern?: ConcernPick }) {
  const total = Math.max(1, cat.count);
  const band = cat.kicker === 'PROTOCOL' ? 'bg-accent-soft' : BAND[cat.zone];
  const strip = STRIP[cat.scopeGroup];
  const n = (k: string) => cat.byScope[k] ?? 0;
  const stripLabel = [...strip.map((s) => `${s.label} ${n(s.key)}`), `not stated ${n('unstated')}`].join(', ');
  const picked = concern?.picked ?? [];
  const hasConcern = cat.facets.includes('target');
  const matching = picked.length && hasConcern ? concernCount(cat, picked) : null;
  const pickedLabel = picked.map((id) => concern?.labels[id] ?? id).join(' or ');
  const search = picked.length && hasConcern ? '?' + picked.map((id) => `${CONCERN_PARAM}=${encodeURIComponent(concernTag(id))}`).join('&') : '';
  return (
    <AppLink to={`/c/${cat.id}${search}`} className={`card card-hover press group flex h-full flex-col overflow-hidden no-underline ${picked.length && !hasConcern ? 'opacity-60' : ''}`}>
      <div className={`flex items-start justify-between gap-3 px-5 pb-4 pt-5 ${band}`}>
        <div>
          <span className="mono block text-[28px] font-extrabold leading-none text-display">{(matching ?? cat.count).toLocaleString('en-IN')}</span>
          <span className="label mt-1 block">
            {matching === null
              ? (picked.length ? 'listings · no skin-concern facet' : 'listings')
              : `of ${cat.count.toLocaleString('en-IN')} for ${pickedLabel}`}
          </span>
        </div>
        <ZoneBadge zone={cat.zone} className="!bg-surface rounded-full px-2.5 py-1" />
      </div>
      <div className="flex flex-1 flex-col p-5 pt-4">
        <span className="label">{cat.kicker}</span>
        <h3 className="mt-1 text-[20px] leading-tight text-display">{cat.label}</h3>
        <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-secondary">{cat.blurb}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-raised" aria-label={stripLabel} role="img">
            {strip.map((s) => <span key={s.key} className={s.cls} style={{ width: `${(n(s.key) / total) * 100}%` }} />)}
          </div>
          <span className="flex items-center gap-1 text-[13px] font-bold text-accent">Open<ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden /></span>
        </div>
      </div>
    </AppLink>
  );
}
