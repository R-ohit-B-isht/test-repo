// Adapter: Philips product catalogue (public PRX product API behind philips.co.in product pages).
// Philips keys every product by a CTN such as "BHD308/10"; the page /c-p/BHD308_10 and the API
// /prx/product/B2C/en_IN/CONSUMER/products/BHD308_10.{summary,specification} are only defined for real CTNs, so a
// catalogue entry exists only when Philips itself answers for that exact CTN. CTNs are harvested from the marketplace
// listings' own model numbers / titles — nothing is guessed beyond the region suffix, and a bare model ("BHD308") is
// only kept if exactly one Indian CTN with that base answers.
import { fetchJson } from './fetch.mjs';

const API = (base, ctn, part) => `${base}/prx/product/B2C/en_IN/CONSUMER/products/${ctn.replace('/', '_')}.${part}`;
export const CTN = /\b([A-Z]{2,3}\d{3,4})(?:\s*\/\s*(\d{2}))?\b/g;
// Indian retail suffixes seen on philips.co.in; the API decides which exist.
const SUFFIXES = ['00', '01', '05', '10', '11', '12', '13', '14', '15', '16', '18', '20', '21', '23', '25', '26', '30', '31', '32', '33', '35', '40', '41', '45', '46', '50', '51', '55', '60', '65', '66', '70', '71', '75', '78', '80', '81', '85', '90', '91', '95', '96', '97', '98'];

function summary(base, ctn) {
  const j = fetchJson(API(base, ctn, 'summary'));
  return j?.success && j.data?.ctn ? j.data : null;
}
function specification(base, ctn) {
  const j = fetchJson(API(base, ctn, 'specification'));
  const kv = {};
  for (const ch of j?.data?.csChapter || []) {
    for (const it of ch.csItem || []) {
      const unit = it.unitOfMeasure?.unitOfMeasureSymbol || '';
      const vals = (it.csValue || []).map((v) => v.csValueName).filter(Boolean);
      if (!vals.length) continue;
      kv[it.csItemName] ??= vals.map((v) => (unit && /^\d/.test(v) ? `${v} ${unit}` : v)).join(', ');
    }
  }
  return kv;
}

/** Harvest CTN candidates from listing titles / spec tables. Returns Map base → Set of full CTNs stated (may be empty). */
export function harvestCtns(listings) {
  const out = new Map();
  for (const l of listings) {
    const spec = l.listingSpec || {};
    const text = `${l.title} ${spec['Model Number'] || ''} ${spec['Model Name'] || ''} ${spec['Model'] || ''}`;
    for (const m of text.toUpperCase().matchAll(CTN)) {
      const base = m[1];
      if (!/^(BHD|HP|BHC|BHS|BHB|BT|MG|QT|QP|QG|BG|S\d|HC|NT|HD|HR|HI|GC|BRE|BRL|BRP|BRT|NL|PQ|AT|S5|S7|S9|SP)/.test(base)) continue;
      const set = out.get(base) || new Set();
      if (m[2]) set.add(`${base}/${m[2]}`);
      out.set(base, set);
    }
  }
  return out;
}

/**
 * @returns catalogue entries { title, url, handle, type, tags, bodyHtml, variants, kv, ctn, ctnBase, ambiguousBase }
 */
export function philipsCatalog(base, listings, { isProduct }) {
  const out = [];
  for (const [ctnBase, stated] of harvestCtns(listings)) {
    const tried = stated.size ? [...stated] : SUFFIXES.map((s) => `${ctnBase}/${s}`);
    const found = [];
    for (const ctn of tried) {
      const s = summary(base, ctn);
      if (!s) continue;
      if (!isProduct(s)) continue;
      found.push({ ctn, s });
    }
    for (const { ctn, s } of found) {
      out.push({
        title: `${s.productTitle} ${ctn}`.trim(), ctn, ctnBase, ambiguousBase: !stated.size && found.length > 1,
        url: `${base}${s.productURL || `/c-p/${ctn.replace('/', '_')}`}`, handle: ctn.replace('/', '_').toLowerCase(),
        type: s.subcategoryName || '', tags: [s.familyName || ''].filter(Boolean), bodyHtml: '', variants: [],
        kv: { 'Model number': ctn, ...(s.familyName ? { 'Product family': s.familyName } : {}), ...specification(base, ctn) },
        image: s.imageURL || null,
      });
    }
  }
  return out;
}
