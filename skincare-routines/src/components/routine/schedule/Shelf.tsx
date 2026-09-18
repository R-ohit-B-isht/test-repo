import { ChevronRight, Moon, Repeat, Sun } from 'lucide-react';
import { ApplicationGuide } from '../ApplicationGuide';
import { EvidenceBadge, ScoreBadge } from '../../ui/primitives';
import { rupees, storeLabel } from '../../../lib/format';
import type { InciSourceKind, InciStatus } from '../../../lib/types';
import { daysSummary, type Step } from '../../../schedule/model';
import { setHave, useMissing } from '../../../schedule/ownedStore';
import { shelfFrom, type ShelfUse } from '../../../schedule/shelf';
import { openListing } from '../../../state/listingPreviewStore';

interface Props { steps: Step[]; monday: string; categoryLabel: (id: string) => string }

const isInciStatus = (v: string | null): v is InciStatus => v === 'full' || v === 'partial' || v === 'garbled' || v === 'none';
const isSourceKind = (v: string | null): v is InciSourceKind => v === 'listing' || v === 'brand-site' || v === 'secondary';
const SLOT_ICON = { am: Sun, pm: Moon } as const;

function UseRow({ use }: { use: ShelfUse }) {
  const Icon = SLOT_ICON[use.step.slot];
  return (
    <li className="flex items-center gap-2">
      <Icon size={13} className="shrink-0 text-accent" aria-label={use.step.slot === 'am' ? 'Morning' : 'Night'} />
      <span className="min-w-0 truncate"><strong className="font-bold text-display">{use.step.title}</strong> · {daysSummary(use.step.days)}</span>
      {use.week && (
        <span className="rota-chip ml-auto shrink-0" title={`Week ${use.week.index} of ${use.week.total} in this step's rotation`}>
          <Repeat size={11} aria-hidden />{use.week.now ? 'this week' : `week ${use.week.index}/${use.week.total}`}
        </span>
      )}
    </li>
  );
}

/** Product shelf: every listing pinned somewhere in the routine, once, with the site's own rank / score / evidence, the steps it
 * serves and a "with me" switch. The switch is your note, kept apart from the routine — flipping it greys that product's
 * steps on Today / Full week without touching them. Empty when no step has a product — never a sample shelf. */
export function Shelf({ steps, monday, categoryLabel }: Props) {
  const items = shelfFrom(steps, monday);
  const missing = useMissing();
  const missingCount = items.filter((i) => missing.has(i.product.id)).length;
  return (
    <section aria-label="Product shelf">
      <p className="label">What you’re using</p>
      <h3 className="mt-1 text-[22px] leading-tight text-display sm:text-[26px]">Your shelf — {items.length} product{items.length === 1 ? '' : 's'}.</h3>
      <p className="mt-1 text-[13px] text-secondary">
        Only listings pinned to your steps. Rank, score and formula evidence are the site’s, not the seller’s.
        {items.length > 0 && (missingCount ? ` ${missingCount} marked not with you — those steps show greyed on Today and Full week.` : ' Switch off anything you’ve run out of; its steps grey out on Today and Full week.')}
      </p>
      {items.length === 0 ? (
        <div className="mt-4 rounded-[16px] border border-dashed border-line-strong px-5 py-8 text-center">
          <p className="text-[14px] font-bold text-display">No products pinned yet</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-secondary">Edit a step and swap in a listing, or plan the week — the shelf fills from your steps.</p>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map(({ product, uses, inUseNow }) => {
            const have = !missing.has(product.id);
            const facts: string[] = [];
            if (product.rank != null && product.of != null) facts.push(`#${product.rank} of ${product.of.toLocaleString('en-IN')} in ${categoryLabel(product.category)}`);
            if (product.priceInr != null) facts.push(rupees(product.priceInr));
            if (product.store) facts.push(storeLabel(product.store));
            const switchId = `have-${product.id}`;
            return (
              <li key={product.id} className={`card flex min-w-0 flex-col gap-3 p-4${have ? '' : ' sched-missing'}`}>
                <div className="flex items-start gap-3">
                  {product.score != null ? <ScoreBadge score={product.score} showVerdict={false} /> : <span className="score" aria-label="Unscored">—</span>}
                  <div className="min-w-0 flex-1">
                    <p className="label flex flex-wrap items-center gap-x-2">
                      {product.brand || categoryLabel(product.category)}
                      {!inUseNow && <span className="rota-chip normal-case tracking-normal"><Repeat size={11} aria-hidden />off this week</span>}
                    </p>
                    <h4 className="mt-0.5 line-clamp-3 text-[15px] font-extrabold leading-snug text-display">{product.title}</h4>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-secondary">
                      {isInciStatus(product.inciStatus) && <EvidenceBadge status={product.inciStatus} source={isSourceKind(product.inciSourceKind) ? product.inciSourceKind : undefined} />}
                      {facts.map((f) => <span key={f}>{f}</span>)}
                    </p>
                  </div>
                </div>
                <button type="button" role="switch" aria-checked={have} aria-labelledby={`${switchId}-label`} aria-describedby={`${switchId}-hint`} onClick={() => setHave(product.id, !have)} className="switch-row press">
                  <span className="min-w-0">
                    <span id={`${switchId}-label`} className="block text-[13px] font-bold text-display">{have ? 'With me' : 'Not with me'}</span>
                    <span id={`${switchId}-hint`} className="block text-[11.5px] text-secondary">{have ? 'Switch off if you’ve run out or haven’t bought it yet' : 'Its steps stay in the plan, shown greyed'}</span>
                  </span>
                  <span className="switch" aria-hidden />
                </button>
                <ul className="space-y-1 text-[12.5px] text-primary" aria-label="Used in">
                  {uses.map((u, i) => <UseRow key={`${u.step.id}-${u.week?.index ?? 0}-${i}`} use={u} />)}
                </ul>
                <ApplicationGuide step={{ category: product.category, title: uses[0].step.title, zone: uses[0].step.zone }} />
                <button type="button" onClick={() => openListing(product.category, product.id)} className="btn mt-auto justify-center">
                  View listing<ChevronRight size={13} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
