/** Maps plain words ("water repellent", "tinted", "fragrance free") onto a category's real facet tags so the model
 * never has to guess tag ids — twin of chat_api/tools/facet_hints.py. Matching is against the tag id, its label and
 * its group label, with a few everyday synonyms. Nothing here invents a tag: only options that exist in the category
 * (with a live count) are ever returned. */
import type { FacetGroupDef, FacetRow } from '../../../lib/types';

const SYNONYMS: Record<string, string[]> = {
  repellent: ['resistant', 'water'], repellant: ['resistant', 'water'], waterproof: ['water', 'resistant'], proof: ['resistant'],
  hydrophobic: ['water', 'resistant'], sweatproof: ['sweat'], swim: ['sport'], swimming: ['sport'], sports: ['sport'], gym: ['sport'],
  tint: ['tinted'], colour: ['tinted'], color: ['tinted'], 'no-fragrance': ['fragrance'], unscented: ['fragrance'], perfume: ['fragrance'],
  scent: ['fragrance'], physical: ['mineral'], organic: ['chemical'], filter: ['mineral', 'chemical', 'hybrid'],
  cheap: ['budget'], verified: ['full', 'brand-site'], official: ['brand-site'], ingredients: ['inci', 'full'], inci: ['inci', 'full'],
  men: ['men'], man: ['men'], male: ['men'], women: ['women'], woman: ['women'], female: ['women'], baby: ['kids'], child: ['kids'],
  pimple: ['acne'], pimples: ['acne'], breakouts: ['acne'], marks: ['dark-spots'], pigmentation: ['dark-spots'], wrinkles: ['aging'],
  antiaging: ['aging'], 'anti-aging': ['aging'], redness: ['irritation'], sensitive: ['sensitive', 'irritation'], calming: ['irritation'],
  big: ['large', 'xl'], small: ['travel'], mini: ['travel'], flipkart: ['flipkart'], amazon: ['amazon'],
};

const STOP = new Set(['and', 'or', 'with', 'for', 'the', 'a', 'an', 'of', 'in', 'on', 'to', 'that', 'is', 'are', 'any', 'some', 'skin', 'hair', 'product', 'products', 'listing', 'listings', 'stated', 'not', 'no']);

export const wordsOf = (text: string) => text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9+-]+/).filter((w) => w && !STOP.has(w));

function expandWords(words: string[]): string[] {
  const out = new Set<string>();
  for (const w of words) {
    out.add(w);
    for (const s of SYNONYMS[w] ?? []) out.add(s);
    if (w.endsWith('s') && w.length > 4) out.add(w.slice(0, -1));
  }
  return [...out];
}

export interface FacetHit { tag: string; label: string; count: number; group: string; groupLabel: string; score: number }

const stem = (w: string) => (w.length > 5 ? w.slice(0, 5) : w);

/** Facet options whose id/label/group share words with `query`, best first (empty when nothing plausible). */
export function matchFacets(query: string, facets: Record<string, FacetRow[]>, groups: Record<string, FacetGroupDef>, limit = 8): FacetHit[] {
  const wanted = expandWords(wordsOf(query.replace(/[:]/g, ' ')));
  if (!wanted.length) return [];
  const hits: FacetHit[] = [];
  for (const [group, rows] of Object.entries(facets)) {
    const groupLabel = groups[group]?.label ?? group;
    const groupWords = new Set([group, ...wordsOf(groupLabel)]);
    for (const row of rows) {
      const value = row.tag.slice(group.length + 1);
      const optionWords = new Set([value, ...value.split('-'), ...wordsOf(row.label)]);
      let score = 0;
      for (const w of wanted) {
        if (optionWords.has(w)) score += 3;
        else if ([...optionWords].some((o) => o.startsWith(stem(w)) || w.startsWith(stem(o)))) score += 2;
        else if (groupWords.has(w)) score += 1;
      }
      if (score > 0 && row.count > 0) hits.push({ tag: row.tag, label: row.label, count: row.count, group, groupLabel, score });
    }
  }
  return hits.sort((a, b) => b.score - a.score || b.count - a.count).slice(0, limit);
}
