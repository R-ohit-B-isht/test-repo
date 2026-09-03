import { clsx } from 'clsx';
import type { FacetRow } from '../../lib/types';
import { PROTOCOL_STEPS } from '../../domain/protocol';


const RULES = [
  'Expect 8–12 weeks (≈ 3 months) before visible change — skin turnover is ~28 days and pigment sits deep. Anyone promising 1-week removal is lying.',
  'Patch-test every new active on the inner arm for 48 h.',
  'Start acids 2–3× a week, not daily; never stack an acid toner and a physical scrub on the same day.',
  'If the patch has been there for years and looks unlike your natural tone, it may be post-inflammatory hyperpigmentation or melasma — get a dermatologist to confirm before months of self-treatment.',
  'Every fading claim below is the seller\u2019s own; none of these are clinical proofs.',
];

interface Props { rows: FacetRow[]; selected: string[]; onToggle: (tag: string) => void }

/** The 4-step old-tan protocol written out, with each step doubling as the step filter. */
export function ProtocolIntro({ rows, selected, onToggle }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <ol className="grid gap-3 sm:grid-cols-2" aria-label="Protocol steps">
        {PROTOCOL_STEPS.map((s) => {
          const count = rows.find((r) => r.tag === s.tag)?.count ?? 0;
          const on = selected.includes(s.tag);
          return (
            <li key={s.tag}>
              <button type="button" aria-pressed={on} onClick={() => onToggle(s.tag)}
                className={clsx('card card-hover press flex h-full w-full flex-col p-4 text-left', on && 'border-primary')}>
                <div className="flex items-baseline justify-between">
                  <span className="display text-[30px] text-accent">{s.n}</span>
                  <span className="mono text-[11px] text-secondary">{count.toLocaleString('en-IN')} products</span>
                </div>
                <p className="mt-2 text-[16px] tracking-wide text-display">{s.name}</p>
                <p className="label mt-0.5">{s.when}</p>
                <p className="mt-2 text-[13px] text-secondary">{s.what}</p>
                <span className="label mt-3 !text-primary">{on ? 'Showing this step ✓' : 'Show products for this step'}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <aside className="card p-5">
        <h3 className="label !text-accent">Honest timeline & safety rules</h3>
        <ul className="mt-3 space-y-2.5 text-[13px] text-primary">{RULES.map((r) => <li key={r} className="flex gap-2"><span className="text-muted">—</span>{r}</li>)}</ul>
      </aside>
    </div>
  );
}
