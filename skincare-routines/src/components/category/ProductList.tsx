import { useEffect, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { CategoryIndex } from '../../domain/index';
import { ProductCard, type ScopeKey } from './ProductCard';

interface Props {
  idx: CategoryIndex; positions: Uint32Array; compare: string[]; compareMax: number;
  onOpen: (id: string) => void; onCompare: (id: string) => void;
}

const ROW_ESTIMATE = 128;
const GAP = 8;

/** Windowed ranked list: one row per listing, only the rows in (and just around) the viewport exist in the DOM. */
export function ProductList({ idx, positions, compare, compareMax, onOpen, onCompare }: Props) {
  const wrap = useRef<HTMLOListElement>(null);
  const [margin, setMargin] = useState(0);
  useEffect(() => {
    const measure = () => { const el = wrap.current; if (el) setMargin(Math.round(el.getBoundingClientRect().top + window.scrollY)); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    return () => ro.disconnect();
  }, [positions.length]);

  const v = useWindowVirtualizer({ count: positions.length, estimateSize: () => ROW_ESTIMATE, overscan: 6, scrollMargin: margin, gap: GAP });
  const scopeTags = new Map<number, ScopeKey>();
  for (const s of ['face', 'body', 'both', 'unstated'] as ScopeKey[]) { const p = idx.tagPos.get(`scope:${s}`); if (p !== undefined) scopeTags.set(p, s); }
  const scopeOf = (t: number[]): ScopeKey => { for (const x of t) { const s = scopeTags.get(x); if (s) return s; } return 'unstated'; };

  return (
    <ol ref={wrap} className="relative w-full list-none p-0" style={{ height: v.getTotalSize() }} aria-label="Ranked listings">
      {v.getVirtualItems().map((vr) => {
        const pos = positions[vr.index];
        const row = idx.items[pos];
        return (
          <li key={row.id} data-index={vr.index} ref={v.measureElement} className="absolute left-0 top-0 w-full" style={{ transform: `translateY(${vr.start - margin}px)` }}>
            <ProductCard row={row} rank={idx.rank[pos]} scope={scopeOf(row.t)}
              compared={compare.includes(row.id)} compareFull={compare.length >= compareMax} onOpen={onOpen} onCompare={onCompare} />
          </li>
        );
      })}
    </ol>
  );
}
