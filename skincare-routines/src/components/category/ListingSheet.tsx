import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { Skeleton, StatusBlock } from '../ui/primitives';
import { ProductSheet } from './ProductSheet';
import { useCategory, useManifest } from '../../data/hooks';
import { placeResolver } from '../../domain/index';

export interface ListingRef {
  category: string;
  id: string;
}

interface Props {
  listing: ListingRef;
  onClose: () => void;
  /** Runs when the "In <category>" list link is followed (e.g. to close an overlay first). */
  onGoToList?: () => void;
}

/** One listing opened in place — the same sheet the list pages use (evidence panel, score breakdown, buy link) — with a
 * shortcut to its position in the ranked list. Loads the category shard itself so any surface can open a product by id. */
export function ListingSheet({ listing, onClose, onGoToList }: Props) {
  const manifest = useManifest();
  const cat = useCategory(listing.category);
  const meta = manifest.status === 'ready' ? manifest.data.categories.find((c) => c.id === listing.category) ?? null : null;

  if (manifest.status !== 'ready' || cat.status === 'loading') {
    return <Sheet open onClose={onClose} title="Loading listing…"><Skeleton className="h-[220px]" /><Skeleton className="mt-4 h-24" /></Sheet>;
  }
  if (!meta || cat.status === 'error') {
    return <Sheet open onClose={onClose} title="Listing"><StatusBlock title="Could not open this listing" body={cat.status === 'error' ? cat.error : `No ranked category called “${listing.category}”.`} /></Sheet>;
  }
  const idx = cat.data;
  const pos = idx.items.findIndex((r) => r.id === listing.id);
  if (pos < 0) {
    return <Sheet open onClose={onClose} title="Listing"><StatusBlock title="Listing not in the current dataset" body="The page data has been regenerated since this was saved — open the category to find the current ranking." /></Sheet>;
  }
  const row = idx.items[pos];
  const scopeOf = placeResolver(idx, meta.scopeGroup);
  const inList = (
    <Link to={`/c/${meta.id}?open=${encodeURIComponent(row.id)}`} onClick={onGoToList} className="btn h-10 gap-1.5 px-3 text-[12px] no-underline" title={`Open in the ${meta.label} list`}>
      <span className="hidden sm:inline">In {meta.label}</span><span className="sm:hidden">List</span> <ArrowUpRight size={13} />
    </Link>
  );
  return (
    <ProductSheet category={meta.id} zone={meta.zone} shards={manifest.data.shards} row={row} rank={idx.rank[pos]} scope={scopeOf(row.t)}
      weights={manifest.data.weights} sources={manifest.data.sources} onClose={onClose} headerExtra={inList} />
  );
}
