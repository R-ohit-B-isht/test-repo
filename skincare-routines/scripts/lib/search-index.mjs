// Cross-category search columns for the in-browser assistant (public/data/search.json + .gz).
// One row per ranked placement (a listing ranked in two categories appears twice, once per rank), columnar so the
// browser can hold 100k+ rows as typed arrays. Titles/brands are copied verbatim from the category rows; the
// browser tokenises them itself, so there is exactly one tokenizer (src/chat/local/search.ts).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export const EV_KEYS = ['full', 'partial', 'garbled', 'none'];
export const ES_KEYS = ['', 'brand-site', 'secondary'];

/** 1-based overall rank per position: score desc, then price asc — identical to the frontend's `buildIndex`. */
export function rankOrder(items) {
  const order = items.map((_, i) => i).sort((x, y) => items[y].s - items[x].s || items[x].p - items[y].p);
  const rank = new Array(items.length);
  order.forEach((pos, r) => { rank[pos] = r + 1; });
  return rank;
}

export class SearchColumns {
  constructor(generatedAt) {
    this.generatedAt = generatedAt;
    this.cats = [];
    this.brands = [];
    this.stores = [];
    this._brandPos = new Map();
    this._storePos = new Map();
    this.id = []; this.title = [];
    this.cat = []; this.brand = []; this.rank = []; this.score = []; this.price = []; this.store = []; this.ev = []; this.es = [];
  }

  _intern(list, pos, value) {
    let i = pos.get(value);
    if (i === undefined) { i = list.length; list.push(value); pos.set(value, i); }
    return i;
  }

  addCategory(categoryId, items) {
    const catIdx = this.cats.push(categoryId) - 1;
    const ranks = rankOrder(items);
    items.forEach((it, i) => {
      const ev = EV_KEYS.indexOf(it.ev);
      const es = ES_KEYS.indexOf(it.es || '');
      if (ev < 0 || es < 0) throw new Error(`${categoryId}/${it.id}: unknown evidence state ${it.ev}/${it.es}`);
      this.id.push(it.id); this.title.push(it.m);
      this.cat.push(catIdx); this.brand.push(this._intern(this.brands, this._brandPos, it.b)); this.rank.push(ranks[i]);
      this.score.push(Math.round(it.s * 10)); this.price.push(it.p); this.store.push(this._intern(this.stores, this._storePos, it.st));
      this.ev.push(ev); this.es.push(es);
    });
  }

  toJSON() {
    const { _brandPos, _storePos, ...cols } = this;
    return { ...cols, n: this.id.length, evKeys: EV_KEYS, esKeys: ES_KEYS };
  }

  /** Writes search.json and search.json.gz; returns the manifest entry (both files carry `generatedAt` for skew checks). */
  write(outDir) {
    const text = JSON.stringify(this);
    fs.writeFileSync(path.join(outDir, 'search.json'), text);
    fs.writeFileSync(path.join(outDir, 'search.json.gz'), zlib.gzipSync(text, { level: 9 }));
    return { file: 'search.json', gzip: 'search.json.gz', rows: this.id.length, bytes: Buffer.byteLength(text) };
  }
}
