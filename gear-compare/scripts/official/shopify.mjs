// Adapter: Shopify storefront → catalogue entries { title, url, handle, type, tags, bodyHtml, price, available, image, grams }.
import { fetchJson } from './fetch.mjs';

// Store-page facts the maker publishes beside the description: lowest in-stock variant price, stock state,
// first gallery image and the shipping weight of that variant (grams; 0 = not filled in by the store).
function storefront(p) {
  const vs = (p.variants || []).filter((v) => Number(v.price) > 0);
  const live = vs.filter((v) => v.available !== false);
  const pick = (live.length ? live : vs).sort((a, b) => Number(a.price) - Number(b.price))[0];
  return {
    price: pick ? Number(pick.price) : null,
    available: live.length > 0,
    image: p.images?.[0]?.src || null,
    grams: pick && Number(pick.grams) > 0 ? Number(pick.grams) : null,
  };
}

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
        ...storefront(p),
      });
    }
    if (prods.length < 250) break;
  }
  return out;
}
