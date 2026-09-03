import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { CategoryIndex } from '../../domain/index';
import { ProductCard, type ScopeKey } from './ProductCard';

interface Props {
  idx: CategoryIndex; positions: Uint32Array; compare: string[]; compareMax: number;
  onOpen: (id: string) => void; onCompare: (id: string) => void;
}

const ROW_ESTIMATE = 292;

function useColumns(ref: React.RefObject<HTMLElement | null>) {
  const [cols, setCols] = useState(1);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const calc = () => setCols(el.clientWidth >= 1180 ? 3 : el.clientWidth >= 620 ? 2 : 1);
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return cols;
}

/** Windowed grid: only the rows in (and just around) the viewport exist in the DOM, however long the list is. */
export function ProductList({ idx, positions, compare, compareMax, onOpen, onCompare }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const cols = useColumns(wrap);
  const rowCount = Math.ceil(positions.length / cols);
  const [margin, setMargin] = useState(0);
  useEffect(() => {
    const measure = () => { const el = wrap.current; if (el) setMargin(Math.round(el.getBoundingClientRect().top + window.scrollY)); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, [positions.length]);

  const v = useWindowVirtualizer({ count: rowCount, estimateSize: () => ROW_ESTIMATE, overscan: 3, scrollMargin: margin, gap: 12 });
  const scopeTags = new Map<number, ScopeKey>();
  for (const s of ['face', 'body', 'both', 'unstated'] as ScopeKey[]) { const p = idx.tagPos.get(`scope:${s}`); if (p !== undefined) scopeTags.set(p, s); }
  const scopeOf = (t: number[]): ScopeKey => { for (const x of t) { const s = scopeTags.get(x); if (s) return s; } return 'unstated'; };

  return (
    <div ref={wrap} className="relative w-full" style={{ height: v.getTotalSize() }}>
      {v.getVirtualItems().map((vr) => (
        <div key={vr.key} data-index={vr.index} ref={v.measureElement}
          className="absolute left-0 top-0 grid w-full gap-3" style={{ transform: `translateY(${vr.start - margin}px)`, gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }, (_, c) => {
            const i = vr.index * cols + c;
            if (i >= positions.length) return null;
            const pos = positions[i];
            const row = idx.items[pos];
            return (
              <ProductCard key={row.id} row={row} rank={idx.rank[pos]} scope={scopeOf(row.t)}
                compared={compare.includes(row.id)} compareFull={compare.length >= compareMax} onOpen={onOpen} onCompare={onCompare} />
            );
          })}
        </div>
      ))}
    </div>
  );
}
