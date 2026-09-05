// Adapter: Shopify storefront → catalogue entries { title, url, handle, type, tags, bodyHtml }.
import { fetchJson } from './fetch.mjs';

export function shopifyCatalog(base, { maxPages = 40 } = {}) {
  const out = [];
  for (let page = 1; page <= maxPages; page++) {
    const j = fetchJson(`${base}/products.json?limit=250&page=${page}`);
    const prods = j?.products || [];
    for (const p of prods) {
      out.push({
        title: p.title,
        url: `${base}/products/${p.handle}`,
        handle: p.handle,
        type: p.product_type || '',
        tags: p.tags || [],
        bodyHtml: p.body_html || '',
        variants: (p.variants || []).map((v) => v.title).filter((t) => t && t !== 'Default Title'),
      });
    }
    if (prods.length < 250) break;
  }
  return out;
}
