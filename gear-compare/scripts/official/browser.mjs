// Adapter: maker sites whose product / spec pages are rendered by JavaScript (GoPro, Insta360, DJI, SJCAM…), read
// through the live Chrome session (CDP) by $GEAR_CDP_FETCH (default ~/gear/cdp-html.cjs). Product URLs come from the
// maker's own index pages (links matching `urlFilter`) plus any `urls` listed explicitly; the rendered document is
// cached beside the curl cache and handed to the generic spec extractor. Nothing is invented: a page that does not
// load, or loads as a 404 / "page not found", is skipped.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const CACHE = process.env.GEAR_CACHE || path.join(process.env.HOME || '', 'gear', 'cache');
const FETCHER = process.env.GEAR_CDP_FETCH || path.join(process.env.HOME || '', 'gear', 'cdp-html.cjs');
fs.mkdirSync(CACHE, { recursive: true });
const key = (u) => `cdp_${u.replace(/[^a-z0-9]+/gi, '_').slice(0, 170)}.json`;
const decode = (s) => String(s).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

/** Rendered pages for `urls` ({ url, status, finalUrl, title, html, links }), read from cache when fresh. */
export function renderedPages(urls, { ttlMs = 30 * 864e5 } = {}) {
  const out = new Map();
  const todo = [];
  for (const u of urls) {
    const f = path.join(CACHE, key(u));
    if (fs.existsSync(f) && Date.now() - fs.statSync(f).mtimeMs < ttlMs) out.set(u, JSON.parse(fs.readFileSync(f, 'utf8')));
    else todo.push(u);
  }
  for (let i = 0; i < todo.length; i += 6) {
    const batch = todo.slice(i, i + 6);
    const tmp = path.join(CACHE, `cdp_batch_${process.pid}_${i}.json`);
    try {
      execFileSync('node', [FETCHER, tmp, ...batch], { stdio: ['ignore', 'inherit', 'inherit'], timeout: 600000 });
      for (const r of JSON.parse(fs.readFileSync(tmp, 'utf8'))) {
        out.set(r.url, r);
        if (r.html) fs.writeFileSync(path.join(CACHE, key(r.url)), JSON.stringify(r));
      }
    } catch (e) {
      console.log(`  cdp fetch failed for ${batch.length} urls: ${String(e).slice(0, 120)}`);
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  }
  return out;
}

const NOT_FOUND = /page not found|404 page|404 not found|<title>[^<]*\b404\b/i;
const h1Of = (html) => {
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()).filter((s) => s.length >= 4 && s.length <= 120);
  return h1s[0] || '';
};
const ogImage = (html) => (/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i.exec(html) || /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html))?.[1] || null;

/**
 * @param {{ index?: string[], urls?: string[], urlFilter?: RegExp, specsUrl?: (u: string) => string, maxUrls?: number, title?: (page: object) => string, names?: Record<string, string>, base?: string }} m
 *   `names` maps a product URL (before `specsUrl`) to the maker's own product name, for makers whose spec page
 *   carries only a generic heading ("Specs", a campaign slogan). A URL that redirects onto another product's page is
 *   dropped, so a discontinued model never borrows its successor's specifications.
 */
export function browserCatalog(m) {
  const product = new Set(m.urls || []);
  if (m.index?.length && m.urlFilter) {
    for (const [, page] of renderedPages(m.index)) {
      for (const l of page.links || []) {
        const u = l.split('#')[0];
        if (m.urlFilter.test(u)) product.add(u);
      }
    }
  }
  const productOf = new Map([...product].map((u) => [m.specsUrl ? m.specsUrl(u) : u, u]));
  const pages = renderedPages([...productOf.keys()].slice(0, m.maxUrls || 200));
  const out = [];
  const seen = new Set();
  const strip = (u) => String(u || '').replace(/[?#].*$/, '').replace(/\/+$/, '');
  for (const [u, p] of pages) {
    if (!p.html || (p.status && p.status >= 400) || NOT_FOUND.test(p.html.slice(0, 4000)) || NOT_FOUND.test(p.title || '')) continue;
    const final = strip(p.finalUrl || u);
    if (final !== strip(u) && ([...productOf.keys()].some((k) => strip(k) === final) || final === strip(m.base))) continue;
    if (seen.has(final)) continue;
    seen.add(final);
    const named = m.names?.[productOf.get(u)] || m.names?.[u];
    const title = named || (m.title ? m.title({ ...p, url: u }) : '') || h1Of(p.html) || decode(p.title || '').replace(/\s*[|–-]\s*[^|–-]{2,40}$/, '').trim();
    if (!title) continue;
    out.push({ title, url: p.finalUrl || u, handle: u.replace(/\/+$/, '').split('/').pop().replace(/\.html?$/, ''), html: p.html, image: ogImage(p.html) });
  }
  return out;
}
