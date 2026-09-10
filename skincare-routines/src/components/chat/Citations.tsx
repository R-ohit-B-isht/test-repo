import { Link } from 'react-router-dom';
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import type { Citations as CitationsPayload, CitedProduct } from '../../chat/types';
import { rupees, storeLabel } from '../../lib/format';
import { EvidenceBadge, ScoreBadge } from '../ui/primitives';

interface Props { citations: CitationsPayload; cited: string[]; onNavigate: () => void }

/** Yelp-Assistant-style ranked entity cards for the listings the answer cited, then category links and the external INCI / maker sources. */
export function Citations({ citations, cited, onNavigate }: Props) {
  const order = new Map(cited.map((id, i) => [id, i]));
  const products = citations.products.slice().sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99)).slice(0, 6);
  const categories = citations.categories.slice(0, 6);
  if (!products.length && !categories.length && !citations.external.length) return null;
  return (
    <div className="mt-3 space-y-3">
      {products.length > 0 && (
        <ul className="space-y-2" aria-label="Listings cited">
          {products.map((p) => <ProductCiteCard key={p.id} p={p} onNavigate={onNavigate} />)}
        </ul>
      )}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Categories cited">
          {categories.map((c) => (
            <Link key={c.id} to={`/c/${c.id}`} onClick={onNavigate} className="chip h-8 px-3 text-[12px] no-underline">
              {c.label ?? c.id}{c.listings != null && <span className="chip-count">{c.listings.toLocaleString('en-IN')}</span>}
            </Link>
          ))}
        </div>
      )}
      {citations.external.length > 0 && (
        <div>
          <p className="label mb-1">Sources read by the tools</p>
          <ul className="space-y-1">
            {citations.external.map((s) => (
              <li key={s.url} className="flex items-start gap-1.5 text-[12.5px]">
                <ExternalLink size={12} className="mt-1 shrink-0 text-muted" aria-hidden />
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="min-w-0 break-words font-semibold text-accent underline underline-offset-2">{s.label}</a>
                {s.kind && <span className="label shrink-0 normal-case">{s.kind === 'brand-site' ? 'official' : s.kind}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProductCiteCard({ p, onNavigate }: { p: CitedProduct; onNavigate: () => void }) {
  return (
    <li>
      <Link to={`/c/${p.category}?open=${encodeURIComponent(p.id)}`} onClick={onNavigate}
        className="card card-hover press flex items-center gap-3 px-3 py-2.5 no-underline">
        <span className="mono w-14 shrink-0 text-[12px] font-bold text-secondary">{p.rank != null ? `#${p.rank}` : '—'}{p.of != null && <span className="font-medium text-muted"> /{p.of.toLocaleString('en-IN')}</span>}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold text-display">{p.brand} <span className="font-medium text-primary">{p.title}</span></span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted">
            {p.priceInr != null && <span className="mono font-semibold text-secondary">{rupees(p.priceInr)}</span>}
            {p.store && <span>{storeLabel(p.store)}</span>}
            {p.inciStatus && <EvidenceBadge status={p.inciStatus} source={p.inciSourceKind ?? undefined} />}
          </span>
        </span>
        {p.score != null && <ScoreBadge score={p.score} showVerdict={false} />}
        <ArrowUpRight size={14} className="shrink-0 text-muted" aria-hidden />
      </Link>
    </li>
  );
}
