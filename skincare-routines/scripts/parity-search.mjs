#!/usr/bin/env node
/** Parity check: the browser SearchIndex (src/chat/local/search.ts over public/data/search.json) must return the same
 * ordered (id, category, strength) lists as chat-api's Python SearchIndex for a set of representative queries.
 * Usage: node scripts/parity-search.mjs   (needs public/data built and chat-api's poetry env). */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import esbuild from 'esbuild';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA = path.join(ROOT, 'public/data');
const QUERIES = [
  'cetaphil', 'cetaphil gentle skin cleanser', "l'oreal revitalift", 'loreal revitalift', 'Kérastase', 'kerastase 8h',
  'minimalist 10% niacinamide', 'la roche posay uvmune 400', 'olaplex no 4', 'dot & key', 'beauty of joseon', 'purito',
  'medicube exosome 7500', 'vitamin c serum', 'anti dandruff shampoo ketoconazole', 'nizoral', 'beard oil', 'kp body lotion urea',
  'sunscreen spf 50 pa++++', 'the ordinary', 'zzzznotaproduct', 'cera', 'a', 'niacin',
];
const CATEGORY_QUERIES = [['cetaphil', 'facewash'], ['la roche posay', 'sunscreen'], ['scrub', 'detan']];
const LIMIT = 15;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parity-'));
const bundle = path.join(tmp, 'search.mjs');
await esbuild.build({ entryPoints: [path.join(ROOT, 'src/chat/local/search.ts')], bundle: true, format: 'esm', platform: 'node', outfile: bundle, logLevel: 'silent' });
const { SearchIndex } = await import(pathToFileURL(bundle).href);
const cols = JSON.parse(fs.readFileSync(path.join(DATA, 'search.json'), 'utf8'));
const ts = new SearchIndex(cols);
const tsOut = {};
for (const q of QUERIES) tsOut[q] = ts.search(q, { limit: LIMIT }).map(({ strength, hit }) => [hit.id, hit.category, strength]);
for (const [q, cat] of CATEGORY_QUERIES) tsOut[`${q}@${cat}`] = ts.search(q, { category: cat, limit: LIMIT }).map(({ strength, hit }) => [hit.id, hit.category, strength]);

const py = `
import asyncio, json, sys
from pathlib import Path
from chat_api.data.source import FileSource
from chat_api.data.store import LedgerStore
async def main():
    store = LedgerStore(FileSource(Path(sys.argv[1])), refresh_seconds=0, category_cache=4, shard_cache=4)
    await store.ensure_fresh(force=True)
    spec = json.loads(sys.argv[2]); out = {}
    for q in spec["queries"]:
        out[q] = [[h.id, h.category, s] for s, h in store.index.search(q, limit=${LIMIT})]
    for q, cat in spec["catQueries"]:
        out[f"{q}@{cat}"] = [[h.id, h.category, s] for s, h in store.index.search(q, category=cat, limit=${LIMIT})]
    print(json.dumps(out))
asyncio.run(main())
`;
const spec = JSON.stringify({ queries: QUERIES, catQueries: CATEGORY_QUERIES });
const pyOut = JSON.parse(execFileSync('poetry', ['run', 'python', '-c', py, DATA, spec], { cwd: path.join(ROOT, 'chat-api'), encoding: 'utf8', maxBuffer: 64e6 }));

let failures = 0;
for (const key of Object.keys(tsOut)) {
  const a = JSON.stringify(tsOut[key]);
  const b = JSON.stringify(pyOut[key]);
  const ok = a === b;
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'DIFF'} ${key.padEnd(40)} ts=${tsOut[key].length} py=${(pyOut[key] ?? []).length}`);
  if (!ok) { console.log('   ts:', a.slice(0, 300)); console.log('   py:', b.slice(0, 300)); }
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(failures ? `${failures} query(ies) differ` : `all ${Object.keys(tsOut).length} queries identical (ts rows=${ts.size}, py rows=${cols.n})`);
process.exit(failures ? 1 : 0);
