import { useMemo } from 'react';
import { useJson, type Loaded } from './fetchJson';
import type { CategoryData, Manifest, ProductDetail } from '../lib/types';
import { buildIndex, type CategoryIndex } from '../domain/index';

const BASE = `${import.meta.env.BASE_URL}data/`;

export const useManifest = () => useJson<Manifest>(`${BASE}manifest.json`);

/** Loads one category's compact rows and builds the tag posting index once per dataset. */
export function useCategory(id: string | undefined): Loaded<CategoryIndex> {
  const raw = useJson<CategoryData>(id ? `${BASE}${id}.json` : null);
  return useMemo<Loaded<CategoryIndex>>(() => {
    if (raw.status !== 'ready') return raw;
    return { status: 'ready', data: buildIndex(raw.data) };
  }, [raw]);
}

function shardOf(id: string, shards: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % shards;
}

/** Lazy detail: the spec sheet / gallery shard is only fetched when a card is expanded. */
export function useDetail(category: string, productId: string | null, shards: number): Loaded<ProductDetail> {
  const shard = useJson<Record<string, ProductDetail>>(productId ? `${BASE}${category}.d${shardOf(productId, shards)}.json` : null);
  return useMemo<Loaded<ProductDetail>>(() => {
    if (shard.status !== 'ready') return shard;
    if (!productId) return { status: 'loading' };
    const d = shard.data[productId];
    return d ? { status: 'ready', data: d } : { status: 'error', error: 'Listing detail not found in data shard' };
  }, [shard, productId]);
}
