/** Text-stream helpers — twin of chat_api/gemini/stream.py: hold back the trailing FOLLOWUPS line while streaming,
 * and collect the citations a turn is allowed to link. */
import type { CategoryMeta } from '../../lib/types';
import type { Citations, CitedCategory, CitedProduct, ExternalSource } from '../types';
import { FOLLOWUP_MARKER } from './prompt';
import type { Json } from './tools/base';

const CITE = /\[\[([^\]]+)\]\]/g;
const RUN = /(.)\1{119}/; // 120× the same character: a table separator or whitespace loop, never prose

/** Length of the longest suffix of `text` that is a proper prefix of `marker`. */
function longestPrefixSuffix(text: string, marker: string): number {
  for (let n = Math.min(text.length, marker.length - 1); n > 0; n--) if (text.endsWith(marker.slice(0, n))) return n;
  return 0;
}

/** Streams text through, but withholds anything that could be the start of the FOLLOWUPS marker until we know.
 * Once the marker is seen, everything after it is captured as the follow-up line instead of being emitted. */
export class TailSplitter {
  private pending = '';
  private tail = '';
  private inTail = false;
  emitted = '';

  push(delta: string): string {
    if (this.inTail) { this.tail += delta; return ''; }
    this.pending += delta;
    const idx = this.pending.indexOf(FOLLOWUP_MARKER);
    if (idx !== -1) {
      const out = this.pending.slice(0, idx);
      this.tail = this.pending.slice(idx + FOLLOWUP_MARKER.length);
      this.pending = '';
      this.inTail = true;
      this.emitted += out;
      return out;
    }
    const hold = longestPrefixSuffix(this.pending, FOLLOWUP_MARKER);
    const out = hold ? this.pending.slice(0, this.pending.length - hold) : this.pending;
    this.pending = this.pending.slice(out.length);
    this.emitted += out;
    return out;
  }

  /** Degenerate generation: a long run of whitespace/padding, or an answer far beyond anything a user asked for. */
  runaway(): boolean {
    const tail = this.emitted.slice(-400);
    return this.emitted.length > 16_000 || (tail.length === 400 && tail.trim().length === 0) || RUN.test(tail);
  }

  flush(): string {
    const out = this.pending;
    this.pending = '';
    this.emitted += out;
    return out.trimEnd();
  }

  followups(): string[] {
    const raw = this.tail.trim().replace(/^:+/, '').trim();
    return raw.split('|').map((p) => p.trim().replace(/^[-•]+|[-•]+$/g, '').trim()).filter(Boolean).slice(0, 3);
  }
}

export const citedIds = (text: string) => [...new Set([...text.matchAll(CITE)].map((m) => m[1]))];

const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const s = (v: unknown) => (typeof v === 'string' ? v : null);
const n = (v: unknown) => (typeof v === 'number' ? v : null);

function rowsOf(result: Json): Json[] {
  if (Array.isArray(result.results)) return result.results.filter(isObj);
  if (Array.isArray(result.products)) return result.products.filter(isObj);
  if (result.id && result.category) return [result];
  return [];
}

const productOf = (row: Json): CitedProduct => ({
  id: String(row.id), category: String(row.category), brand: s(row.brand) ?? '', title: s(row.title) ?? '',
  rank: n(row.rank), of: n(row.of), score: n(row.score), priceInr: n(row.priceInr), store: s(row.store), url: s(row.url),
  inciStatus: s(row.inciStatus) as CitedProduct['inciStatus'], inciSourceKind: s(row.inciSourceKind) as CitedProduct['inciSourceKind'],
});

/** Collects every listing/category a tool returned so the frontend can resolve [[id]] markers to real links. */
export class CitationBook {
  readonly products = new Map<string, CitedProduct>();
  readonly categories = new Map<string, CitedCategory>();
  readonly external = new Map<string, ExternalSource>();

  private readonly categoryMeta: (id: string) => CategoryMeta | null;
  private readonly pageCategory: string | null;

  constructor(categoryMeta: (id: string) => CategoryMeta | null, pageCategory: string | null) {
    this.categoryMeta = categoryMeta; this.pageCategory = pageCategory;
  }

  private touchCategory(cid: string | null, url: string | null = null) {
    if (!cid || this.categories.has(cid)) return;
    const meta = this.categoryMeta(cid);
    this.categories.set(cid, { id: cid, label: meta?.label, zone: meta?.zone, listings: meta?.count, url: url ?? undefined });
  }

  /** One listing can be ranked in several categories. The card must show ONE placement: the page's category if a tool
   * returned it, otherwise the placement the answer was first grounded on. */
  private keepPlacement(pid: string, category: string) {
    const seen = this.products.get(pid);
    return !seen || seen.category === category || category === this.pageCategory;
  }

  absorb(tool: string, result: Json) {
    for (const row of rowsOf(result)) {
      const pid = s(row.id);
      const category = s(row.category);
      if (pid && category && s(row.title)) {
        this.touchCategory(category);
        if (this.keepPlacement(pid, category)) this.products.set(pid, productOf(row));
      }
      const ev = isObj(row.detail) && isObj(row.detail.evidence) ? row.detail.evidence : null;
      const src = ev ? s(ev.inciSourceUrl) : null;
      if (ev && src) this.external.set(src, { label: s(ev.inciSource) ?? 'INCI source', url: src, kind: s(ev.inciSourceKind) });
    }
    if (tool === 'list_categories' && Array.isArray(result.categories)) {
      for (const cat of result.categories.filter(isObj)) {
        this.categories.set(String(cat.id), { id: String(cat.id), label: s(cat.label) ?? undefined, zone: s(cat.zone) ?? undefined, listings: n(cat.listings) ?? undefined, url: s(cat.url) ?? undefined });
      }
    }
    if (tool === 'get_reference_ceiling') {
      const maker = isObj(result.makerPage) ? result.makerPage : null;
      const makerUrl = maker ? s(maker.url) : null;
      if (maker && makerUrl) this.external.set(makerUrl, { label: `${s(result.brand)} ${s(result.name)} — ${s(maker.label) ?? 'maker page'}`, url: makerUrl, kind: 'maker' });
      const listing = isObj(result.marketplaceListing) ? result.marketplaceListing : null;
      if (listing && s(listing.id)) {
        this.products.set(String(listing.id), {
          id: String(listing.id), category: String(result.category), brand: s(result.brand) ?? '', title: s(listing.title) ?? s(result.name) ?? '',
          rank: n(listing.rank), of: n(listing.of), score: n(listing.listingScore), priceInr: n(listing.priceInr), store: s(listing.store), url: s(listing.url),
        });
      }
    }
    if (tool === 'get_ingredient_knowledge') this.absorbKnowledge(result);
    if (typeof result.category === 'string') this.touchCategory(result.category, s(result.url));
  }

  /** Categories where an asked ingredient is a core active become citable; the studies behind the pairing verdicts
   * become external sources so general guidance carries its provenance like a listing does. */
  private absorbKnowledge(result: Json) {
    const list = (v: unknown) => (Array.isArray(v) ? v.filter(isObj) : []);
    for (const ing of list(result.ingredients)) {
      for (const ranked of list(ing.rankedIn)) this.touchCategory(s(ranked.category), s(ranked.url));
    }
    for (const pairing of list(result.pairingsBetweenAsked)) {
      for (const src of list(pairing.sources)) {
        const url = s(src.url);
        if (url && !this.external.has(url)) this.external.set(url, { label: s(src.label) ?? 'study', url, kind: 'study' });
      }
    }
  }

  /** Ids the model cited that no tool returned in this turn — the frontend must not link them. */
  unverified(answer: string): string[] {
    return citedIds(answer).filter((i) => !(this.products.has(i) || (i.startsWith('cat:') && this.categories.has(i.slice(4)))));
  }

  payload(answer: string): Citations {
    const used = citedIds(answer);
    const cited = used.filter((i) => this.products.has(i)).map((i) => this.products.get(i)!);
    return {
      products: cited.length ? cited : [...this.products.values()].slice(0, 8),
      categories: used.filter((i) => i.startsWith('cat:') && this.categories.has(i.slice(4))).map((i) => this.categories.get(i.slice(4))!),
      external: [...this.external.values()].slice(0, 6),
    };
  }
}
