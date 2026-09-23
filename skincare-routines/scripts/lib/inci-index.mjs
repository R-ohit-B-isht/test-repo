// Per-category ingredient columns for the assistant (public/data/<cat>.inci.json + .gz), aligned with the
// `items` order of <cat>.json. `inci` holds the normalised declared list for rows whose INCI is verified (full or
// partial); `claimed` holds the seller's unverified key-ingredients line for the rest — the tools report the two
// separately so a seller claim is never presented as a formula fact.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { normalizeInci } = require('./inci-aliases.cjs');

export const INCI_SUFFIX = 'inci.json';
export const INCI_GZIP_SUFFIX = 'inci.json.gz';

const VERIFIED = new Set(['full', 'partial']);

export class InciColumns {
  constructor(categoryId, generatedAt) {
    this.id = categoryId;
    this.generatedAt = generatedAt;
    this.inci = [];
    this.claimed = [];
    this.verified = 0;
    this.claimedRows = 0;
  }

  add(rec) {
    const ev = rec.evidence || {};
    const text = VERIFIED.has(ev.inci) && ev.inciText ? normalizeInci(ev.inciText) : '';
    const claimed = !text && ev.inciUnverified ? normalizeInci(ev.inciUnverified) : '';
    if (text) this.verified += 1;
    if (claimed) this.claimedRows += 1;
    this.inci.push(text);
    this.claimed.push(claimed);
  }

  toJSON() {
    return { id: this.id, generatedAt: this.generatedAt, n: this.inci.length, verified: this.verified, claimedRows: this.claimedRows, inci: this.inci, claimed: this.claimed };
  }

  /** Writes <cat>.inci.json and its gzip; returns the per-category manifest entry. */
  write(outDir) {
    const text = JSON.stringify(this);
    fs.writeFileSync(path.join(outDir, `${this.id}.${INCI_SUFFIX}`), text);
    fs.writeFileSync(path.join(outDir, `${this.id}.${INCI_GZIP_SUFFIX}`), zlib.gzipSync(text, { level: 9 }));
    return { verified: this.verified, claimed: this.claimedRows, bytes: Buffer.byteLength(text) };
  }
}
