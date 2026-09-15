import { useState } from 'react';
import { ArrowUpRight, Star } from 'lucide-react';
import { useCategory, useManifest } from '../../data/hooks';
import { retryJson } from '../../data/fetchJson';
import { PERSONAL_PICKS, type PickKey } from '../../data/personalPicks';
import { placeResolver } from '../../domain';
import { rupees, storeLabel } from '../../lib/format';
import { ProductSheet } from '../category/ProductSheet';
import { AppLink } from '../ui/AppLink';
import { EvidenceBadge, Skeleton } from '../ui/primitives';

export function PersonalProduct({ pickKey }: { pickKey: PickKey }) {
  const pick = PERSONAL_PICKS[pickKey];
  const category = useCategory(pick.category);
  const manifest = useManifest();
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  if (category.status === 'loading' || manifest.status === 'loading') {
    return <div className="personal-product" role="status"><Skeleton className="h-24 w-full" /><span className="sr-only">Loading ranked product</span></div>;
  }
  if (category.status === 'error' || manifest.status === 'error') {
    return <div className="personal-product space-y-3"><p>Product data could not load.</p>
      <button className="btn" type="button" onClick={() => {
        retryJson(`${import.meta.env.BASE_URL}data/${pick.category}.json`);
        if (manifest.status === 'error') retryJson(`${import.meta.env.BASE_URL}data/manifest.json`);
      }}>Retry product</button></div>;
  }
  const index = category.data;
  const position = index.items.findIndex((row) => row.id === pick.id);
  const row = index.items[position];
  const meta = manifest.data.categories.find((item) => item.id === pick.category);
  if (!row || !meta) {
    return <div className="personal-product"><p>This selected listing is unavailable.</p>
      <AppLink to={`/c/${pick.category}`}>Browse current category rankings</AppLink></div>;
  }
  const rank = index.rank[position];
  return (
    <article className="personal-product">
      <div className="flex items-start gap-4">
        <button type="button" className="personal-product-image press" onClick={() => setOpen(true)} aria-label={`View ${row.b} ${row.m}`}>
          {row.img && !imageFailed
            ? <img src={row.img} alt={`${row.b} ${row.m}`} loading="lazy" onError={() => setImageFailed(true)} />
            : <span className="text-[12px] text-secondary">Image unavailable</span>}
        </button>
        <div className="min-w-0 flex-1">
          <p className="label text-accent">{row.b}</p>
          <button type="button" onClick={() => setOpen(true)} className="mt-1 text-left text-[14px] font-bold leading-snug text-display hover:underline">{row.m}</button>
          <p className="mt-2 text-[12px] leading-relaxed text-secondary">{pick.match}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px]">
        <AppLink to={`/c/${pick.category}`} className="personal-rank">#{rank.toLocaleString('en-IN')} <span className="font-medium">in {meta.label}</span></AppLink>
        <span className="flex items-center gap-1 font-bold text-display">
          <Star size={12} className="text-warning" aria-hidden />
          {row.r === null ? 'No buyer rating' : `${row.r.toFixed(1)} / 5`}
          {row.r !== null && row.rc !== null && <span className="font-medium text-secondary">({row.rc.toLocaleString('en-IN')})</span>}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[12px]">
        <span className="text-secondary">Evidence <strong className="mono text-primary">{row.s.toFixed(1)}/100</strong></span>
        <span className="text-secondary">{storeLabel(row.st)} · <strong className="text-primary">{rupees(row.p)}</strong></span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <EvidenceBadge status={row.ev} source={row.es} />
        <button type="button" className="personal-detail-link press" onClick={() => setOpen(true)}>Details & shop <ArrowUpRight size={14} aria-hidden /></button>
      </div>
      {open && <ProductSheet category={pick.category} zone={meta.zone} shards={manifest.data.shards}
        row={row} rank={rank} scope={placeResolver(index, meta.scopeGroup)(row.t)}
        weights={manifest.data.weights} sources={manifest.data.sources} onClose={() => setOpen(false)} />}
    </article>
  );
}
