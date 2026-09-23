import { ChevronRight } from 'lucide-react';
import { EvidenceBadge, ScoreBadge } from '../ui/primitives';
import { rupees, storeLabel } from '../../lib/format';
import type { InciSourceKind, InciStatus } from '../../lib/types';
import type { StepProduct } from '../../schedule/model';
import { openListing } from '../../state/listingPreviewStore';

const isInciStatus = (v: string | null): v is InciStatus => v === 'full' || v === 'partial' || v === 'garbled' || v === 'none';
const isSourceKind = (v: string | null): v is InciSourceKind => v === 'listing' || v === 'brand-site' || v === 'secondary';

interface Props {
  product: StepProduct;
  categoryLabel: (id: string) => string;
}

/** The real listing pinned to a step: rank, score, evidence and price exactly as the site shows them. Tapping opens the
 * listing's product sheet in place (the same sheet as the list pages) instead of leaving the routine. */
export function ProductSnippet({ product, categoryLabel }: Props) {
  const facts: string[] = [];
  if (product.rank != null && product.of != null) facts.push(`#${product.rank} of ${product.of.toLocaleString('en-IN')} in ${categoryLabel(product.category)}`);
  if (product.priceInr != null) facts.push(rupees(product.priceInr));
  if (product.store) facts.push(storeLabel(product.store));
  return (
    <button type="button" onClick={() => openListing(product.category, product.id)} aria-label={`Open ${product.brand ? `${product.brand} ` : ''}${product.title}`}
      className="card-hover press group flex w-full items-center gap-3 rounded-[12px] border border-line bg-raised/60 px-3 py-2.5 text-left">
      {product.score != null ? <ScoreBadge score={product.score} showVerdict={false} /> : <span className="score" aria-label="Unscored">—</span>}
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[13px] font-bold leading-snug text-display">{product.brand ? `${product.brand} · ` : ''}{product.title}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-secondary">
          {isInciStatus(product.inciStatus) && <EvidenceBadge status={product.inciStatus} source={isSourceKind(product.inciSourceKind) ? product.inciSourceKind : undefined} />}
          {facts.map((f) => <span key={f}>{f}</span>)}
        </span>
      </span>
      <ChevronRight size={14} className="shrink-0 text-muted transition-colors group-hover:text-display" aria-hidden />
    </button>
  );
}
