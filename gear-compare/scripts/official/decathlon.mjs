// Adapter: Decathlon Sports India (decathlon.in) → catalogue entries. The store is a SvelteKit app whose product
// pages are server-rendered with the product state serialised inline (`a.productName=…;a.productSpecifications=[…]`),
// beside schema.org Product JSON-LD. Read from that page, never invented:
//   productSpecifications → spec rows (kv)      technicalInformation / benefits / description → maker prose (text)
//   articles[].priceForFront / inStock → price   warranty (years) → kv Warranty   review → store rating + count
// Product URLs come from sitemap-products.xml filtered by the category's URL pattern.
import { fetchText } from './fetch.mjs';
import { sitemapUrls } from './sitemap.mjs';

export const DECATHLON_SITEMAP = 'https://www.decathlon.in/sitemap-products.xml';

// Values in the serialised state are JS literals (double-quoted strings with \n / \" / \uXXXX escapes).
const unq = (s) => {
  try { return JSON.parse(s); } catch { return s.slice(1, -1); }
};
const STR = /"(?:[^"\\]|\\.)*"/y;
const readStr = (blk, at) => { STR.lastIndex = at; const m = STR.exec(blk); return m ? [unq(m[0]), STR.lastIndex] : null; };
const scalar = (blk, key) => {
  const m = new RegExp(`\\ba\\.${key}=`).exec(blk);
  if (!m) return null;
  const at = m.index + m[0].length;
  if (blk[at] === '"') return readStr(blk, at)?.[0] ?? null;
  const v = /^[^;]*/.exec(blk.slice(at))?.[0] ?? '';
  return v === 'null' || v === 'undefined' ? null : v === 'true' ? true : v === 'false' ? false : Number.isFinite(Number(v)) ? Number(v) : v;
};
// `a.key=[{name:"…",description:"…"},…]` — objects with string fields, no nesting except image URLs.
function namedList(blk, key) {
  const m = new RegExp(`\\ba\\.${key}=\\[`).exec(blk);
  if (!m) return [];
  let i = m.index + m[0].length;
  const out = [];
  let cur = null;
  let depth = 1;
  while (i < blk.length && depth > 0) {
    const ch = blk[i];
    if (ch === '"') { const r = readStr(blk, i); if (!r) break; i = r[1]; continue; }
    if (ch === '{') { depth++; cur = {}; i++; continue; }
    if (ch === '}') { depth--; if (cur) out.push(cur); cur = null; i++; continue; }
    if (ch === ']') { depth--; i++; continue; }
    if (cur && /[a-zA-Z]/.test(ch)) {
      const km = /^([a-zA-Z]+):/.exec(blk.slice(i, i + 40));
      if (km) {
        i += km[0].length;
        if (blk[i] === '"') { const r = readStr(blk, i); if (!r) break; cur[km[1]] = r[0]; i = r[1]; continue; }
        const vm = /^[^,}]*/.exec(blk.slice(i)); cur[km[1]] = vm[0]; i += vm[0].length; continue;
      }
    }
    i++;
  }
  return out;
}
const num = (s) => { const m = /(\d+(?:\.\d+)?)/.exec(String(s)); return m ? Number(m[1]) : null; };
const ldProducts = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map((m) => { try { return JSON.parse(m[1]); } catch { return null; } })
  .filter((d) => d && d['@type'] === 'Product');

/** Parse one server-rendered decathlon.in product page; null when the page is not a product page. */
export function parseDecathlonPage(html, url) {
  const i = html.indexOf('a.productName=');
  if (i < 0) return null;
  const j = html.lastIndexOf('<script', i);
  const k = html.indexOf('</script>', i);
  const blk = html.slice(j, k);
  const title = scalar(blk, 'productName');
  if (!title) return null;
  const raw = String(scalar(blk, 'brand') || 'Decathlon').trim();
  const brand = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  const ld = ldProducts(html)[0];
  const prices = [...blk.matchAll(/sellingPrice:(\d+(?:\.\d+)?)/g)].map((m) => Number(m[1])).filter((n) => n > 0);
  const price = prices.length ? Math.min(...prices) : num(ld?.offers?.price);
  const kv = {};
  for (const s of namedList(blk, 'productSpecifications')) {
    const v = String(s.description || '').trim();
    if (s.name && v && !/^(?:none|n\/a|-|unavailable)$/i.test(v) && !/unavailable$/i.test(v)) kv[String(s.name).trim()] = v;
  }
  const warranty = scalar(blk, 'warranty');
  if (warranty && Number(warranty) > 0) kv.Warranty = `${warranty} year${Number(warranty) > 1 ? 's' : ''}`;
  const madeIn = scalar(blk, 'madeIn');
  if (madeIn) kv['Made in'] = madeIn;
  const tech = namedList(blk, 'technicalInformation').filter((t) => t.name && t.description && !/^size$/i.test(t.name));
  const benefits = namedList(blk, 'benefits').filter((b) => b.name && b.description);
  const text = [
    scalar(blk, 'description') || ld?.description || '',
    ...benefits.map((b) => `${b.name}: ${b.description}`),
    ...tech.map((t) => `${t.name} ${t.description}`),
  ].filter(Boolean).join('\n');
  const rating = num(/averageRating:(\d+(?:\.\d+)?)/.exec(blk)?.[1]);
  const ratingCount = num(/averageRating:[\d.]+,count:(\d+)/.exec(blk)?.[1]);
  const category = /a\.category=\{[^}]*name:"([^"]+)"/.exec(blk)?.[1] || '';
  return {
    title, brand, url, handle: url.replace(/\/$/, '').split('/').slice(-2).join('-'),
    type: category, tags: [], bodyHtml: '', variants: [], html: '',
    kv, text, price: price > 0 ? price : null, available: scalar(blk, 'inStock') === true,
    image: Array.isArray(ld?.image) ? ld.image[0] : ld?.image || null,
    grams: null, // articles[].weight is the shipping weight, not the product's stated weight
    rating: rating && rating >= 1 && rating <= 5 && ratingCount ? rating : null, ratingCount: rating && ratingCount ? ratingCount : null,
  };
}

/**
 * @param {{ urlFilter: RegExp, ownBrand?: RegExp, maxUrls?: number }} opts — product-URL pattern for the category.
 * Decathlon also resells third-party brands (Ledlenser, adidas…); those pages are a retailer's listing, not the
 * maker's own statement, so only Decathlon house brands (`ownBrand`) are returned as official catalogue entries.
 */
export function decathlonCatalog({ urlFilter, ownBrand, maxUrls = 400 }) {
  const out = [];
  for (const url of sitemapUrls(DECATHLON_SITEMAP, { urlFilter, maxUrls, maxDepth: 0 })) {
    const html = fetchText(url);
    if (!html) continue;
    const p = parseDecathlonPage(html, url);
    if (!p) continue;
    if (ownBrand && !ownBrand.test(p.brand)) {
      console.log(`  ${p.brand.padEnd(12)} resold, not Decathlon's own → skipped: ${p.title}`);
      continue;
    }
    out.push(p);
  }
  return out;
}
