// Facet group definitions + tag → human label. Site-specific groups come from the site schema; the global groups
// (segment, evidence tier, maker, rating, store) are the same on every site.
import { EVIDENCE_STATUS } from './registry.mjs';

export const GLOBAL_GROUPS = ['seg', 'ev', 'maker', 'rating', 'store'];

const GLOBAL_LABELS = {
  'ev:official': 'Maker-verified specs',
  'ev:listing': 'Marketplace spec table only',
  'ev:claimed': 'Title / seller claims only',
  'ev:none': 'No specs published',
  'maker:global': 'Global manufacturer (Indian entity)',
  'maker:india': 'Established Indian manufacturer',
  'maker:d2c': 'Indian D2C brand',
  'maker:unknown': 'Maker not verified',
  'rating:4.5': '4.5★ and up',
  'rating:4': '4.0–4.4★',
  'rating:3.5': '3.5–3.9★',
  'rating:low': 'Under 3.5★',
  'rating:none': 'No ratings yet',
  'store:flipkart': 'Flipkart',
  'store:amazon': 'Amazon.in',
};

export function groupDefsFor(site) {
  const defs = {
    seg: { label: site.segment.label, hint: 'Read from the stated specification; unstated listings are kept separate', multi: false },
    ev: { label: 'Evidence', hint: 'Where the specifications were actually read from', multi: false },
    maker: { label: 'Maker', hint: 'Verified manufacturer / importer behind the brand', multi: false },
    rating: { label: 'Buyer rating', hint: 'Marketplace star rating', multi: false },
    store: { label: 'Store', hint: '', multi: false },
  };
  for (const f of site.facets) defs[f.group] = { label: f.label, hint: f.hint || '', multi: Boolean(f.multi) };
  return defs;
}

export function labelFor(site, tag) {
  if (GLOBAL_LABELS[tag]) return GLOBAL_LABELS[tag];
  const [g, v] = [tag.slice(0, tag.indexOf(':')), tag.slice(tag.indexOf(':') + 1)];
  if (g === 'seg') return site.segment.options.find((o) => o.id === v)?.label || v;
  const fc = site.facets.find((x) => x.group === g);
  if (fc && fc.labels[v]) return fc.labels[v];
  if (g === 'ev' && EVIDENCE_STATUS.includes(v)) return v;
  return v;
}
