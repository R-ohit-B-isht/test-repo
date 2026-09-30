import { useState } from 'react';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import type { PackBag } from '../../lib/types';

/** The bag, as the maker states it — the only source of the budgets on the planner and set pages. `compact` folds the maker facts behind a disclosure so the answer below stays in the first screen. */
export function BagCard({ bag, compact = false }: { bag: PackBag; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  const facts = (
    <dl className="divide-y divide-line text-[13px]">
      {bag.facts.map((f) => (
        <div key={f.k} className="grid grid-cols-[minmax(90px,32%)_1fr] gap-3 py-2">
          <dt className="text-secondary">{f.k}</dt><dd className="font-semibold text-display">{f.v}</dd>
        </div>
      ))}
    </dl>
  );
  return (
    <aside className="card p-4" aria-label="The bag this plan is for">
      <div className="flex gap-4">
        <div className="flex h-28 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-line">
          {failed ? <span className="px-2 text-center text-[11px] font-bold text-muted">Image unavailable</span>
            : <img src={bag.image.url} alt={`${bag.brand} ${bag.name}`} width={96} height={112} decoding="async" className="h-full w-full object-contain p-1" onError={() => setFailed(true)} />}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-accent">{bag.brand}</p>
          <p className="mt-0.5 text-[15px] font-extrabold leading-snug text-display">{bag.name}</p>
          <a href={bag.maker.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold text-accent">{bag.maker.label}<ArrowUpRight size={13} aria-hidden /></a>
          <p className="mt-1 text-[12px] text-muted">Read {bag.checked} · image: {bag.image.source}</p>
        </div>
      </div>
      {compact ? (
        <details className="group mt-3">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-bold text-accent">
            <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden />{bag.facts.length} facts from the maker's page
          </summary>
          <div className="mt-2">{facts}</div>
        </details>
      ) : <div className="mt-4">{facts}</div>}
    </aside>
  );
}
