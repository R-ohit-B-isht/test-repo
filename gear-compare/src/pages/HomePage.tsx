import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useManifest } from '../data/hooks';
import { useDevPublish } from '../components/dev/devStore';
import { Hero } from '../components/layout/Hero';
import { AppLink } from '../components/ui/AppLink';
import { NumberTicker, SectionHead, StatusBlock } from '../components/ui/primitives';
import { CategorySections } from '../components/hub/CategorySections';
import { MethodCard } from '../components/hub/MethodCard';
import { SCORE_META } from '../domain/scoreMeta';
import type { EvidenceStatus } from '../lib/types';

/** Landing = the hub. Every number on it is summed from the manifest; nothing is typed in by hand. */
export default function HomePage() {
  const manifest = useManifest();
  const [params] = useSearchParams();
  const isDev = params.get('dev') === '1';

  const totals = useMemo(() => {
    if (manifest.status !== 'ready') return null;
    const ev: Record<EvidenceStatus, number> = { official: 0, listing: 0, claimed: 0, none: 0 };
    let flipkart = 0; let amazon = 0;
    for (const c of manifest.data.categories) {
      for (const k of Object.keys(ev) as EvidenceStatus[]) ev[k] += c.evidence[k];
      flipkart += c.stores.flipkart; amazon += c.stores.amazon;
    }
    return { ev, flipkart, amazon, categories: manifest.data.categories.length, benchmarks: manifest.data.benchmarks.length };
  }, [manifest]);

  useDevPublish(isDev, { page: 'hub', categories: totals?.categories ?? 0, listings: manifest.status === 'ready' ? manifest.data.total : 0, official: totals?.ev.official ?? 0, benchmarks: totals?.benchmarks ?? 0 });

  if (manifest.status === 'error') return <StatusBlock title="Could not load the catalogue" body={manifest.error} />;
  if (manifest.status === 'loading' || !totals) return <StatusBlock title="Loading catalogue…" />;
  const m = manifest.data;
  const first = m.categories[0];

  return (
    <div className="pb-16">
      <Hero kicker="Gear compared on evidence · India"
        title="Specs the maker actually published, not the adjectives in the listing title."
        lede="Every product is a real Flipkart or Amazon.in listing. Its score comes only from specifications we could read on the maker’s own product page or in the marketplace spec table — “ultra fast”, “premium” and “heavy duty” in the title count for nothing. Each category opens with the best product in the world at a fixed 100 so you can see how far the Indian shelf is from the ceiling."
        proofs={[`${m.total.toLocaleString('en-IN')} real listings`, `${totals.ev.official.toLocaleString('en-IN')} maker-verified`, `${totals.categories} categories · ${totals.benchmarks} reference ceilings`, `Weights ${Object.values(m.weights).map((w) => Math.round(w * 100)).join(' · ')}`]}
        aside={(
          <div className="card p-5" aria-labelledby="coverage-h">
            <p id="coverage-h" className="label">Where the specs came from</p>
            <dl className="mt-3 grid grid-cols-2 gap-4">
              <div><dt className="text-[12px] font-bold text-success">Maker page</dt><dd className="mono mt-0.5 text-[26px] font-extrabold leading-none text-display"><NumberTicker value={totals.ev.official} /></dd></div>
              <div><dt className="text-[12px] font-bold text-accent">Spec table only</dt><dd className="mono mt-0.5 text-[26px] font-extrabold leading-none text-display"><NumberTicker value={totals.ev.listing} /></dd></div>
              <div><dt className="text-[12px] font-bold text-warning">Claims only</dt><dd className="mono mt-0.5 text-[26px] font-extrabold leading-none text-display"><NumberTicker value={totals.ev.claimed} /></dd></div>
              <div><dt className="text-[12px] font-bold text-muted">No specs</dt><dd className="mono mt-0.5 text-[26px] font-extrabold leading-none text-display"><NumberTicker value={totals.ev.none} /></dd></div>
            </dl>
            <p className="mt-4 text-[12px] text-muted">{totals.flipkart.toLocaleString('en-IN')} Flipkart · {totals.amazon.toLocaleString('en-IN')} Amazon.in · captured {m.generatedAt.slice(0, 10)}</p>
          </div>
        )}>
        <a href="#categories-h" className="btn btn-accent h-12 px-6 no-underline">Browse categories</a>
        {first && <AppLink to={`/c/${first.id}`} className="btn h-12 px-6">{first.label} <ArrowRight size={14} /></AppLink>}
      </Hero>

      <section className="mt-10" aria-labelledby="categories-h">
        <SectionHead id="categories-h" title="Pick a category" sub="Grouped by family. The bar on each card is how much of that category is maker-verified (green), spec-table only (teal), claims only (amber) or has no specs at all." />
        <div className="mt-8"><CategorySections categories={m.categories} families={m.families} /></div>
      </section>

      <section className="-mx-4 mt-20 rounded-[24px] bg-surface px-4 py-12 sm:-mx-6 sm:px-6 lg:px-10" aria-labelledby="method-h">
        <div className="max-w-2xl">
          <p className="label !text-accent">How the score is built</p>
          <h2 id="method-h" className="mt-2 text-[clamp(26px,3.4vw,40px)] leading-tight text-display">Four dimensions. Price is shown, never scored.</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-secondary">A value read from the maker’s product page earns full credit; the same value from a marketplace spec table earns 60% because the seller typed it; a value that only appears in the title or seller bullets earns 0. Implausible numbers are rejected and shown as rejected. Missing fields say “not stated”.</p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SCORE_META.map((s) => <MethodCard key={s.key} meta={s} weight={m.weights[s.key]} criterion={m.criteria[s.key]} />)}
        </div>
      </section>
    </div>
  );
}
