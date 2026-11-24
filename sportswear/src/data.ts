import { useEffect, useState } from 'react';

export type Dim = 'tier' | 'tech' | 'materials' | 'buyers' | 'transparency';
export interface Row { id: string; b: string; n: string; u: string; c: string; d: string; s: number; sc: Record<Dim, number>; img: string; r: number | null; rc: number | null; p: number | null; m: number | null; k: 0 | 1; t: number[] }
export interface Cat { id: string; label: string; dept: string; count: number; top: string[]; img: string; byBrand: Record<string, number> }
export interface Manifest { generatedAt: string; total: number; scope: string; weights: Record<Dim, number>; criteria: Record<Dim, string>; depts: Record<string, string>; shards: number; categories: Cat[]; brands: Record<string, number>; sources: Record<string, string> }
export interface RowsFile { tagIndex: [string, string][]; facetCounts: Record<string, number>; priceRange: [number, number]; rows: Row[] }
export interface Detail { url: string; source: string; path: string[]; desc: string; bullets: { section: string; text: string }[]; materials: string[]; care: string[]; attrs: Record<string, string>; style: string | null; colour: string | null; colours: number; images: string[]; origin: string | null; sizes: string[] | null; reasons: string[] }

export const DIM_LABEL: Record<Dim, string> = { tier: 'Maker tier', tech: 'Technology', materials: 'Materials', buyers: 'Buyer rating', transparency: 'Spec transparency' };
export const GROUPS: { id: string; label: string; open?: boolean }[] = [
  { id: 'brand', label: 'Brand', open: true }, { id: 'dept', label: 'Department', open: true }, { id: 'cat', label: 'Category', open: true },
  { id: 'sport', label: 'Sport', open: true }, { id: 'gender', label: 'Gender', open: true }, { id: 'age', label: 'Age group' },
  { id: 'tier', label: 'Maker tier' }, { id: 'team', label: 'Team / club / F1 team' }, { id: 'line', label: 'Line / franchise' },
  { id: 'tech', label: 'Technology' }, { id: 'material', label: 'Material' }, { id: 'feature', label: 'Features & fit' }, { id: 'stock', label: 'Availability' }, { id: 'evidence', label: 'Evidence' },
];

const cache = new Map<string, Promise<unknown>>();
export function load<T>(path: string): Promise<T> {
  if (!cache.has(path)) cache.set(path, fetch(`${import.meta.env.BASE_URL}data/${path}`).then((r) => { if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json(); }));
  return cache.get(path) as Promise<T>;
}
export function useLoad<T>(path: string | null): T | null {
  const [v, setV] = useState<T | null>(null);
  useEffect(() => { let on = true; if (path) load<T>(path).then((x) => on && setV(x)); return () => { on = false; }; }, [path]);
  return v;
}
export function shardOf(id: string, shards: number) { let h = 7; for (const ch of id) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0; return h % shards; }
export function useDetail(id: string | null, shards: number | undefined): Detail | null {
  const f = useLoad<Record<string, Detail>>(id && shards ? `detail/${shardOf(id, shards)}.json` : null);
  return id && f ? f[id] ?? null : null;
}
export const rupees = (n: number | null) => (n == null ? '—' : '₹' + n.toLocaleString('en-IN'));
export const verdict = (s: number) => (s >= 85 ? 'Exceptional' : s >= 75 ? 'Excellent' : s >= 65 ? 'Very good' : s >= 55 ? 'Good' : s >= 45 ? 'Fair' : 'Basic');
export const tone = (s: number) => (s >= 75 ? 'bg-[var(--success)]' : s >= 60 ? 'bg-[var(--accent)]' : s >= 45 ? 'bg-[var(--warning-fill)]' : 'bg-[var(--muted)]');
