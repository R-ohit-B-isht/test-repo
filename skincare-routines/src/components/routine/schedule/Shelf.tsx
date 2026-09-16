import { ExternalLink, Moon, Sun } from 'lucide-react';
import { ApplicationGuide } from '../ApplicationGuide';
import { AppLink } from '../../ui/AppLink';
import { EvidenceBadge, ScoreBadge } from '../../ui/primitives';
import { rupees, storeLabel } from '../../../lib/format';
import type { InciSourceKind, InciStatus } from '../../../lib/types';
import { daysSummary, type Step } from '../../../schedule/model';
import { shelfFrom } from '../../../schedule/shelf';

interface Props { steps: Step[]; categoryLabel: (id: string) => string }

const isInciStatus = (v: string | null): v is InciStatus => v === 'full' || v === 'partial' || v === 'garbled' || v === 'none';
const isSourceKind = (v: string | null): v is InciSourceKind => v === 'listing' || v === 'brand-site' || v === 'secondary';
const SLOT_ICON = { am: Sun, pm: Moon } as const;

/** Product shelf: every listing pinned somewhere in the routine, once, with the site's own rank / score / evidence and the
 * steps it serves. Opens the same product sheet as the list pages. Empty when no step has a product — never a sample shelf. */
export function Shelf({ steps, categoryLabel }: Props) {
  const items = shelfFrom(steps);
  return (
    <section aria-label="Product shelf">
      <p className="label">What you’re using</p>
      <h3 className="mt-1 text-[22px] leading-tight text-display sm:text-[26px]">Your shelf — {items.length} product{items.length === 1 ? '' : 's'}.</h3>
      <p className="mt-1 text-[13px] text-secondary">Only listings pinned to your steps. Rank, score and formula evidence are the site’s, not the seller’s.</p>
      {items.length === 0 ? (
        <div className="mt-4 rounded-[16px] border border-dashed border-line-strong px-5 py-8 text-center">
          <p className="text-[14px] font-bold text-display">No products pinned yet</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-secondary">Edit a step and swap in a listing, or plan the week — the shelf fills from your steps.</p>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map(({ product, steps: used }) => {
            const facts: string[] = [];
            if (product.rank != null && product.of != null) facts.push(`#${product.rank} of ${product.of.toLocaleString('en-IN')} in ${categoryLabel(product.category)}`);
            if (product.priceInr != null) facts.push(rupees(product.priceInr));
            if (product.store) facts.push(storeLabel(product.store));
            return (
              <li key={product.id} className="card flex min-w-0 flex-col gap-3 p-4">
                <div className="flex items-start gap-3">
                  {product.score != null ? <ScoreBadge score={product.score} showVerdict={false} /> : <span className="score" aria-label="Unscored">—</span>}
                  <div className="min-w-0 flex-1">
                    <p className="label">{product.brand || categoryLabel(product.category)}</p>
                    <h4 className="mt-0.5 line-clamp-3 text-[15px] font-extrabold leading-snug text-display">{product.title}</h4>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-secondary">
                      {isInciStatus(product.inciStatus) && <EvidenceBadge status={product.inciStatus} source={isSourceKind(product.inciSourceKind) ? product.inciSourceKind : undefined} />}
                      {facts.map((f) => <span key={f}>{f}</span>)}
                    </p>
                  </div>
                </div>
                <ul className="space-y-1 text-[12.5px] text-primary" aria-label="Used in">
                  {used.map((s) => {
                    const Icon = SLOT_ICON[s.slot];
                    return (
                      <li key={s.id} className="flex items-center gap-2">
                        <Icon size={13} className="shrink-0 text-accent" aria-label={s.slot === 'am' ? 'Morning' : 'Night'} />
                        <span className="min-w-0 truncate"><strong className="font-bold text-display">{s.title}</strong> · {daysSummary(s.days)}</span>
                      </li>
                    );
                  })}
                </ul>
                <ApplicationGuide step={used[0]} />
                <AppLink to={`/c/${product.category}?open=${encodeURIComponent(product.id)}`} className="btn mt-auto justify-center no-underline">
                  Open in {categoryLabel(product.category)}<ExternalLink size={13} aria-hidden />
                </AppLink>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
