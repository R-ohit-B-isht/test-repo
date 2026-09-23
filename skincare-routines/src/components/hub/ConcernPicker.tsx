import { X } from 'lucide-react';
import type { CategoryMeta, FacetGroupDef } from '../../lib/types';

interface Props {
  concerns: { id: string; label: string }[];
  group: FacetGroupDef;
  categories: CategoryMeta[];
  picked: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
}

/** Hub-level "Skin concern" chips (Etsy / Kayak quick filters): pick Acne / Dark spots / Aging / Irritation once and every skin category below reports how many of its listings match and opens with that filter already on. */
export function ConcernPicker({ concerns, group, categories, picked, onToggle, onClear }: Props) {
  const totals = Object.fromEntries(concerns.map((c) => [c.id, categories.reduce((n, cat) => n + (cat.byConcern[c.id] ?? 0), 0)]));
  return (
    <section aria-labelledby="hub-concern" className="card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 id="hub-concern" className="text-[20px] text-display">{group.label}</h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-secondary">{group.hint}. Hair and scalp pages use their own concern set.</p>
        </div>
        {picked.length > 0 && (
          <button type="button" onClick={onClear} className="press flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold text-secondary hover:bg-raised">
            <X size={14} aria-hidden /> Clear
          </button>
        )}
      </div>
      <div className="scrollbar-none -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label={group.label}>
        {concerns.map((c) => {
          const on = picked.includes(c.id);
          const n = totals[c.id] ?? 0;
          return (
            <button key={c.id} type="button" className="chip shrink-0" aria-pressed={on} onClick={() => onToggle(c.id)} disabled={!on && n === 0}>
              {c.label}<span className="chip-count mono">{n.toLocaleString('en-IN')}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
