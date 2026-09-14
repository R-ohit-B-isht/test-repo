import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { Skeleton, StatusBlock } from '../ui/primitives';
import { ProductSheet } from '../category/ProductSheet';
import { useCategory, useManifest } from '../../data/hooks';
import { placeResolver } from '../../domain/index';
import { closeChat, closeProduct, type ProductPreview } from '../../chat/chatStore';

/** A listing cited in an answer, opened over the chat in the same sheet the list pages use — same evidence panel, same
 * score breakdown, same buy link — with a shortcut to its place in the ranked list. */
export function ChatProductSheet({ preview }: { preview: ProductPreview | null }) {
  if (!preview) return null;
  return <Loaded preview={preview} />;
}

function Loaded({ preview }: { preview: ProductPreview }) {
  const manifest = useManifest();
  const cat = useCategory(preview.category);
  const meta = manifest.status === 'ready' ? manifest.data.categories.find((c) => c.id === preview.category) ?? null : null;

  if (manifest.status !== 'ready' || cat.status === 'loading') {
    return <Sheet open onClose={closeProduct} title="Loading listing…"><Skeleton className="h-[220px]" /><Skeleton className="mt-4 h-24" /></Sheet>;
  }
  if (!meta || cat.status === 'error') {
    return <Sheet open onClose={closeProduct} title="Listing"><StatusBlock title="Could not open this listing" body={cat.status === 'error' ? cat.error : `No ranked category called “${preview.category}”.`} /></Sheet>;
  }
  const idx = cat.data;
  const pos = idx.items.findIndex((r) => r.id === preview.id);
  if (pos < 0) {
    return <Sheet open onClose={closeProduct} title="Listing"><StatusBlock title="Listing not in the current dataset" body="The page data has been regenerated since this answer — ask again for the current ranking." /></Sheet>;
  }
  const row = idx.items[pos];
  const scopeOf = placeResolver(idx, meta.scopeGroup);
  const inList = (
    <Link to={`/c/${meta.id}?open=${encodeURIComponent(row.id)}`} onClick={closeChat} className="btn h-10 gap-1.5 px-3 text-[12px] no-underline" title={`Open in the ${meta.label} list`}>
      <span className="hidden sm:inline">In {meta.label}</span><span className="sm:hidden">List</span> <ArrowUpRight size={13} />
    </Link>
  );
  return (
    <ProductSheet category={meta.id} zone={meta.zone} shards={manifest.data.shards} row={row} rank={idx.rank[pos]} scope={scopeOf(row.t)}
      weights={manifest.data.weights} sources={manifest.data.sources} onClose={closeProduct} headerExtra={inList} />
  );
}
