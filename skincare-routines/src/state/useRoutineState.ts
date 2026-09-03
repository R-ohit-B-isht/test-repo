import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isRoutineSort, type RoutineFilter } from '../domain/routines';

/** Routine filters in the URL (rc = category, ph = phase, steps, q, sort), same memento approach as product pages. */
export function useRoutineState() {
  const [params, setParams] = useSearchParams();
  const state = useMemo<RoutineFilter>(() => from(params), [params]);

  const update = useCallback((patch: Partial<RoutineFilter>) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      const s = { ...from(prev), ...patch };
      next.delete('rc'); s.categories.forEach((c) => next.append('rc', c));
      next.delete('ph'); s.phases.forEach((p) => next.append('ph', p));
      if (s.maxSteps === null) next.delete('steps'); else next.set('steps', String(s.maxSteps));
      if (s.query) next.set('q', s.query); else next.delete('q');
      if (s.sort === 'score') next.delete('sort'); else next.set('sort', s.sort);
      return next;
    }, { replace: true });
  }, [setParams]);

  const toggle = useCallback((key: 'categories' | 'phases', v: string) => {
    const cur = state[key];
    update({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  }, [state, update]);

  const clearAll = useCallback(() => update({ categories: [], phases: [], maxSteps: null, query: '' }), [update]);
  const activeCount = state.categories.length + state.phases.length + (state.maxSteps !== null ? 1 : 0) + (state.query ? 1 : 0);
  return { state, update, toggle, clearAll, activeCount, isDev: params.get('dev') === '1' };
}

function from(p: URLSearchParams): RoutineFilter {
  const steps = p.get('steps');
  const sort = p.get('sort');
  return {
    categories: p.getAll('rc'),
    phases: p.getAll('ph'),
    maxSteps: steps && /^\d+$/.test(steps) ? Number(steps) : null,
    query: p.get('q') ?? '',
    sort: isRoutineSort(sort) ? sort : 'score',
  };
}
