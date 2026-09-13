/** Loads the columnar search file. The static host serves no Content-Encoding, so the pre-gzipped copy is fetched and
 * inflated with DecompressionStream where available; anything else falls back to the plain JSON. */
import type { SearchColumns } from '../../lib/types';

const GZIP_MAGIC = [0x1f, 0x8b];

async function readJson(res: Response): Promise<SearchColumns> {
  if (!res.ok || !res.body) throw new Error(`${res.url} → HTTP ${res.status}`);
  const [probe, rest] = res.body.tee();
  const reader = probe.getReader();
  const head = await reader.read();
  reader.cancel().catch(() => undefined);
  const gz = !!head.value && head.value[0] === GZIP_MAGIC[0] && head.value[1] === GZIP_MAGIC[1];
  const stream = gz ? rest.pipeThrough(new DecompressionStream('gzip')) : rest;
  return JSON.parse(await new Response(stream).text()) as SearchColumns;
}

export async function loadSearchColumns(jsonUrl: string, gzipUrl: string): Promise<SearchColumns> {
  if (typeof DecompressionStream === 'function') {
    try { return await readJson(await fetch(gzipUrl)); } catch { /* fall through to the plain file */ }
  }
  return readJson(await fetch(jsonUrl));
}
