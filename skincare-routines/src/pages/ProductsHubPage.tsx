import { useManifest } from '../data/hooks';
import { Hero } from '../components/layout/Hero';
import { CategorySections } from '../components/hub/CategorySections';
import { LiveDataBadge, NumberTicker, StatusBlock } from '../components/ui/primitives';
import { useDevPublish } from '../components/dev/devStore';
import { useSearchParams } from 'react-router-dom';
import { SCORE_META } from '../domain/scoreMeta';

export default function ProductsHubPage() {
  const manifest = useManifest();
  const [params] = useSearchParams();
  useDevPublish(params.get('dev') === '1', {
    page: 'products-hub',
    categories: manifest.status === 'ready' ? manifest.data.categories.length : null,
    listings: manifest.status === 'ready' ? manifest.data.total : null,
  });
  if (manifest.status === 'error') return <StatusBlock title="Could not load the product index" body={manifest.error} />;
  if (manifest.status === 'loading') return <StatusBlock title="Loading product categories…" />;
  const m = manifest.data;
  const byScope = m.categories.reduce((a, c) => ({ face: a.face + c.byScope.face, body: a.body + c.byScope.body, both: a.both + c.byScope.both }), { face: 0, body: 0, both: 0 });
  return (
    <div className="pb-16">
      <Hero kicker="Product rankings · India"
        title="Every skincare category, ranked from real listings."
        lede="Captured live from Flipkart and Amazon.in product pages, scored from the published ingredient list, the accountable maker and real buyer ratings — seller marketing counts for nothing. Fields the seller never stated are shown as exactly that."
        proofs={[`${m.total.toLocaleString('en-IN')} listings · ${m.categories.length} categories`, `${byScope.face.toLocaleString('en-IN')} face · ${byScope.both.toLocaleString('en-IN')} face + body · ${byScope.body.toLocaleString('en-IN')} body`, 'Price and seller claims never scored']}
        aside={
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="label">Listings ranked</p>
                <p className="mt-1 text-[36px] font-extrabold leading-none text-display"><NumberTicker value={m.total} /></p>
              </div>
              <LiveDataBadge capturedAt={m.generatedAt} />
            </div>
            <p className="label mt-5 border-t border-line pt-4">How the score is built · evidence only</p>
            <ul className="mt-3 space-y-3">
              {SCORE_META.map((s) => {
                const w = Math.round(m.weights[s.key] * 100);
                return (
                  <li key={s.key}>
                    <div className="flex items-baseline justify-between gap-3 text-[14px]"><span className="font-bold text-display">{s.label}</span><span className="mono font-extrabold text-accent">{w}</span></div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised"><span className="block h-full rounded-full bg-accent" style={{ width: `${w}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          </div>
        }
      />
      <div className="mt-6">
        <CategorySections categories={m.categories} />
      </div>
    </div>
  );
}
