import { useManifest } from '../data/hooks';
import { Hero } from '../components/layout/Hero';
import { CategorySections } from '../components/hub/CategorySections';
import { StatusBlock } from '../components/ui/primitives';
import { useDevPublish } from '../components/dev/devStore';
import { useSearchParams } from 'react-router-dom';

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
  return (
    <>
      <Hero kicker="Product rankings · India" number={m.categories.length.toString().padStart(2, '0')}
        title="Every skincare category, ranked from real listings."
        lede={`${m.total.toLocaleString('en-IN')} listings captured live from Flipkart and Amazon.in. Ranked on brand trust ${Math.round(m.weights.trust * 100)} · skin safety ${Math.round(m.weights.skin * 100)} · actives ${Math.round(m.weights.ingredients * 100)} · format ${Math.round(m.weights.experience * 100)}. Price is shown, never scored.`}
        matrix />
      <div className="mt-10">
        <CategorySections categories={m.categories} />
      </div>
    </>
  );
}
