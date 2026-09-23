import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EMPTY_FILTER, type FilterState } from '../domain/filter';
import { isSortKey, type SortKey } from '../domain/sort';
import { groupOf } from '../domain/index';

export interface ViewState extends FilterState { sort: SortKey }

/** Filter/sort state lives in the URL so views are shareable and survive reloads (memento in the address bar). */
export function useFilterState() {
  const [params, setParams] = useSearchParams();

  const state = useMemo<ViewState>(() => stateFrom(params), [params]);

  const update = useCallback((patch: Partial<ViewState>) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      const merged: ViewState = { ...stateFrom(prev), ...patch };
      next.delete('f'); merged.tags.forEach((t) => next.append('f', t));
      next.delete('all'); merged.allGroups.forEach((g) => next.append('all', g));
      if (merged.priceMax === null) next.delete('pmax'); else next.set('pmax', String(merged.priceMax));
      if (merged.query) next.set('q', merged.query); else next.delete('q');
      if (merged.sort === 'score') next.delete('sort'); else next.set('sort', merged.sort);
      return next;
    }, { replace: true });
  }, [setParams]);

  const toggleTag = useCallback((tag: string) => {
    const has = state.tags.includes(tag);
    update({ tags: has ? state.tags.filter((t) => t !== tag) : [...state.tags, tag] });
  }, [state.tags, update]);

  const toggleAll = useCallback((group: string) => {
    const has = state.allGroups.includes(group);
    update({ allGroups: has ? state.allGroups.filter((g) => g !== group) : [...state.allGroups, group] });
  }, [state.allGroups, update]);

  const clearGroup = useCallback((group: string) => {
    update({ tags: state.tags.filter((t) => groupOf(t) !== group) });
  }, [state.tags, update]);

  const clearAll = useCallback(() => update({ ...EMPTY_FILTER }), [update]);

  const activeCount = state.tags.length + (state.priceMax !== null ? 1 : 0) + (state.query ? 1 : 0);

  return { state, update, toggleTag, toggleAll, clearGroup, clearAll, activeCount, isDev: params.get('dev') === '1' };
}

function stateFrom(p: URLSearchParams): ViewState {
  const sort = p.get('sort');
  const pmax = p.get('pmax');
  return {
    tags: p.getAll('f'),
    allGroups: p.getAll('all'),
    priceMax: pmax && /^\d+$/.test(pmax) ? Number(pmax) : null,
    query: p.get('q') ?? '',
    sort: isSortKey(sort) ? sort : 'score',
  };
}
