/** Manual product picking for the routine editor: the same cross-category search index the assistant uses, so a step can
 *  be pinned to ANY listing the site ranks — never a typed-in name. Empty query + category → that page's top ranks. */
import { chatConfig } from '../chat/config';
import { LedgerStore } from '../chat/local/store';
import type { StepProduct } from './model';
import type { Hit } from '../chat/local/search';

const store = new LedgerStore();

const snapshot = (hit: Hit, of: number | null, siteUrl: string): StepProduct => ({
  id: hit.id, category: hit.category, brand: hit.brand, title: hit.title, rank: hit.rank, of, score: hit.score, priceInr: hit.price, store: hit.store,
  inciStatus: hit.inci, inciSourceKind: hit.inciSource ?? (hit.inci === 'full' ? 'listing' : null), url: `${siteUrl}/#/c/${hit.category}?open=${hit.id}`,
});

export async function searchListings(query: string, category: string | null, limit = 12): Promise<StepProduct[]> {
  const [index, config] = await Promise.all([store.search(), chatConfig()]);
  await store.manifest();
  const siteUrl = config.siteUrl || window.location.origin;
  const of = (id: string) => store.categoryMeta(id)?.count ?? null;
  const q = query.trim();
  if (!q) {
    if (!category) return [];
    const view = await store.category(category);
    return view.byRank.slice(0, limit).map((pos) => {
      const hit = index.get(view.items[pos].id, category);
      return hit ? snapshot(hit, of(category), siteUrl) : null;
    }).filter((p): p is StepProduct => p !== null);
  }
  return index.search(q, { category, limit }).map(({ hit }) => snapshot(hit, of(hit.category), siteUrl));
}
