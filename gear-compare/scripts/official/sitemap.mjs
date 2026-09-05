// Adapter: XML sitemap → catalogue entries { title, url, handle, type, tags, bodyHtml, variants } for makers that are
// not on Shopify (Vega, Decathlon, Woodland, V-Guard, Dyson…). Product URLs are picked by the maker's own URL pattern;
// the page <title> / og:title is the maker's product name. Nothing is invented: a URL with no fetchable page is skipped.
import { fetchText } from './fetch.mjs';

const locs = (xml) => [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].trim());
const decode = (s) => String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

/** Follow sitemap indexes (one level deep per hop, max `maxDepth`) and return every product URL matching `urlFilter`. */
export function sitemapUrls(entry, { urlFilter, childFilter = /./, maxDepth = 2, maxUrls = 4000 } = {}) {
  const out = new Set();
  const queue = [].concat(entry).map((u) => [u, 0]);
  const seen = new Set();
  while (queue.length && out.size < maxUrls) {
    const [u, depth] = queue.shift();
    if (seen.has(u)) continue;
    seen.add(u);
    const xml = fetchText(u);
    if (!xml) continue;
    const isIndex = /<sitemapindex/i.test(xml);
    for (const l of locs(xml)) {
      if (isIndex || /\.xml(?:\.gz)?(?:\?|$)/i.test(l)) { if (depth < maxDepth && childFilter.test(l)) queue.push([l, depth + 1]); continue; }
      if (urlFilter.test(l)) out.add(l);
    }
  }
  return [...out];
}

// The page's single <h1> is the maker's own product name (model code included); og:title / <title> are SEO copy
// ("Buy Vega … | Foldable & Powerful") and only used when there is no usable h1.
export function pageTitle(html) {
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()).filter((s) => s.length >= 6 && s.length <= 160);
  if (h1s.length === 1) return h1s[0];
  const og = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i.exec(html) || /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i.exec(html);
  const t = og?.[1] || /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1] || '';
  return decode(t).replace(/\s+/g, ' ').replace(/^buy\s+/i, '').replace(/\s*[|–-]\s*[^|–-]{2,40}$/, '').trim();
}

/**
 * @param {string|string[]} entry sitemap URL(s) (robots.txt "Sitemap:" lines are the usual source)
 * @param {{ urlFilter: RegExp, childFilter?: RegExp, titleFilter?: RegExp, maxUrls?: number }} opts
 */
export function sitemapCatalog(entry, opts) {
  const out = [];
  for (const url of sitemapUrls(entry, opts)) {
    const html = fetchText(url);
    if (!html) continue;
    const title = pageTitle(html);
    if (!title || (opts.titleFilter && !opts.titleFilter.test(title))) continue;
    out.push({ title, url, handle: url.replace(/\/$/, '').split('/').pop().replace(/\.html?$/, ''), type: '', tags: [], bodyHtml: '', variants: [], html });
  }
  return out;
}
