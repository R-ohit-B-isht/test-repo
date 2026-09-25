import { useEffect, useMemo, useSyncExternalStore } from 'react';

export type Loaded<T> = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; data: T };

const LOADING: Loaded<never> = { status: 'loading' };
const results = new Map<string, Loaded<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Fetch-once JSON loader (proxy/cache pattern): the same URL is never fetched twice per session. */
export function loadJson<T>(url: string): Promise<T> {
  const done = results.get(url);
  if (done?.status === 'ready') return Promise.resolve(done.data as T);
  let p = inflight.get(url) as Promise<T> | undefined;
  if (!p) {
    p = fetch(url)
      .then((res) => { if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`); return res.json() as Promise<T>; })
      .then((data) => { results.set(url, { status: 'ready', data }); return data; })
      .catch((err: Error) => { results.set(url, { status: 'error', error: err.message }); throw err; })
      .finally(() => { inflight.delete(url); notify(); });
    inflight.set(url, p);
  }
  return p;
}

/** Retry a failed URL (errors are cached so the UI stays stable until the user asks again). */
export function retryJson(url: string) { results.delete(url); notify(); }

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

/** Several resources at once (the planner needs every role's category). Ready only when all are; the first error wins. */
export function useJsonMany<T>(urls: readonly string[]): Loaded<Record<string, T>> {
  const key = urls.join('\n');
  // The caller's array identity may change every render; the joined key is the stable identity of the request set.
  const list = useMemo(() => key.split('\n').filter(Boolean), [key]);
  const version = useSyncExternalStore(subscribe, () => list.map((u) => { const r = results.get(u); return r ? r.status : 'loading'; }).join(), () => '');
  useEffect(() => { for (const u of list) if (!results.has(u)) loadJson<T>(u).catch(() => undefined); }, [list]);
  return useMemo<Loaded<Record<string, T>>>(() => {
    const out: Record<string, T> = {};
    for (const u of list) {
      const r = results.get(u) as Loaded<T> | undefined;
      if (!r || r.status === 'loading') return LOADING;
      if (r.status === 'error') return r;
      out[u] = r.data;
    }
    return { status: 'ready', data: out };
  // `version` is the store snapshot that says which of these URLs have settled; it changes whenever a load finishes.
  }, [list, version]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** Read a JSON resource as an external store — cached resources resolve synchronously with no loading flash. */
export function useJson<T>(url: string | null): Loaded<T> {
  const snapshot = useSyncExternalStore(subscribe, () => (url ? (results.get(url) as Loaded<T> | undefined) ?? LOADING : LOADING), () => LOADING);
  useEffect(() => { if (url && !results.has(url)) loadJson<T>(url).catch(() => undefined); }, [url]);
  return snapshot;
}
