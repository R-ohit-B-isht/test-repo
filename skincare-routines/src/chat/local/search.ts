/** Cross-category listing search over the columnar `search.json` — the browser twin of chat_api/data/search.py.
 * Every query token must match (whole word = 1.0, prefix = 0.5); results are ordered by match strength, then site rank. */
import type { InciSourceKind, InciStatus, SearchColumns } from '../../lib/types';

const TOKEN = /[a-z0-9]+/g;
const NON_ASCII_OR_APOSTROPHE = /[\u0080-\uffff]|['`]/g;
const PREFIX_SCAN = 400;

/** Lower-case, strip accents and apostrophes (L'Oréal → loreal) so brands match however they were typed. */
export const fold = (text: string) => text.normalize('NFKD').replace(NON_ASCII_OR_APOSTROPHE, '').toLowerCase();
export const tokens = (text: string) => fold(text).match(TOKEN) ?? [];

export interface Hit {
  category: string; id: string; brand: string; title: string;
  score: number; rank: number; price: number; store: string;
  inci: InciStatus; inciSource: InciSourceKind | null;
}

export class SearchIndex {
  private readonly cols: SearchColumns;
  private readonly postings = new Map<string, number[]>();
  private readonly byId = new Map<string, number[]>();
  private readonly vocab: string[];

  constructor(cols: SearchColumns) {
    this.cols = cols;
    for (let pos = 0; pos < cols.n; pos++) {
      const id = cols.id[pos];
      const placements = this.byId.get(id);
      if (placements) placements.push(pos); else this.byId.set(id, [pos]);
      for (const tok of new Set(tokens(`${cols.brands[cols.brand[pos]]} ${cols.title[pos]}`))) {
        const list = this.postings.get(tok);
        if (list) list.push(pos); else this.postings.set(tok, [pos]);
      }
    }
    this.vocab = [...this.postings.keys()].sort();
  }

  get size() { return this.cols.n; }
  get generatedAt() { return this.cols.generatedAt; }

  hit(pos: number): Hit {
    const c = this.cols;
    const es = c.esKeys[c.es[pos]];
    return {
      category: c.cats[c.cat[pos]], id: c.id[pos], brand: c.brands[c.brand[pos]], title: c.title[pos],
      score: c.score[pos] / 10, rank: c.rank[pos], price: c.price[pos], store: c.stores[c.store[pos]],
      inci: c.evKeys[c.ev[pos]], inciSource: es === '' ? null : (es as InciSourceKind),
    };
  }

  /** One listing can be ranked in several categories: prefer the placement the caller is looking at, else its best rank. */
  get(productId: string, preferCategory?: string | null): Hit | null {
    const placements = this.byId.get(productId);
    if (!placements) return null;
    const hits = placements.map((p) => this.hit(p));
    return hits.find((h) => h.category === preferCategory) ?? hits.reduce((best, h) => (h.rank < best.rank ? h : best));
  }

  placements(productId: string): Hit[] {
    return (this.byId.get(productId) ?? []).map((p) => this.hit(p));
  }

  private candidates(tok: string): { exact: number[]; prefix: Set<number> } {
    const exact = this.postings.get(tok) ?? [];
    const prefix = new Set<number>();
    if (tok.length >= 3) {
      let lo = 0, hi = this.vocab.length;
      while (lo < hi) { const mid = (lo + hi) >>> 1; if (this.vocab[mid] < tok) lo = mid + 1; else hi = mid; }
      for (let i = lo; i < Math.min(lo + PREFIX_SCAN, this.vocab.length); i++) {
        const word = this.vocab[i];
        if (!word.startsWith(tok)) break;
        if (word !== tok) for (const p of this.postings.get(word)!) prefix.add(p);
      }
    }
    return { exact, prefix };
  }

  search(query: string, opts: { category?: string | null; limit?: number } = {}): { strength: number; hit: Hit }[] {
    const q = [...new Set(tokens(query))];
    if (!q.length) return [];
    let strength: Map<number, number> | null = null;
    for (const tok of q) {
      const { exact, prefix } = this.candidates(tok);
      const step = new Map<number, number>();
      for (const p of exact) step.set(p, 1);
      for (const p of prefix) if (!step.has(p)) step.set(p, 0.5);
      if (strength === null) strength = step;
      else {
        const next = new Map<number, number>();
        for (const [p, s] of strength) { const add = step.get(p); if (add !== undefined) next.set(p, s + add); }
        strength = next;
      }
      if (!strength.size) return [];
    }
    const rows: { strength: number; hit: Hit; pos: number }[] = [];
    for (const [p, s] of strength!) {
      const hit = this.hit(p);
      if (!opts.category || hit.category === opts.category) rows.push({ strength: s, hit, pos: p });
    }
    rows.sort((a, b) => b.strength - a.strength || a.hit.rank - b.hit.rank || b.hit.score - a.hit.score || a.pos - b.pos);
    return rows.slice(0, opts.limit ?? 10).map(({ strength: s, hit }) => ({ strength: s, hit }));
  }
}
