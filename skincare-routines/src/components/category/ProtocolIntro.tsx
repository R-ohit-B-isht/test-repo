import { clsx } from 'clsx';
import { Check, ShieldAlert } from 'lucide-react';
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

const TITLE: Record<string, string> = { EXFOLIATE: 'Exfoliate', TREAT: 'Treat', MOISTURIZE: 'Moisturize', PROTECT: 'Protect' };

/** Fabulous / LifeSum "your plan" strip: 4 numbered stage cards joined by a path line; each stage doubles as the step filter. */
export function ProtocolIntro({ rows, selected, onToggle }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <ol className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Protocol steps">
        <span className="pointer-events-none absolute left-[calc(12.5%)] right-[calc(12.5%)] top-[38px] hidden h-0.5 bg-line-strong xl:block" aria-hidden />
        {PROTOCOL_STEPS.map((s, i) => {
          const count = rows.find((r) => r.tag === s.tag)?.count ?? 0;
          const on = selected.includes(s.tag);
          return (
            <li key={s.tag} className="relative">
              <button type="button" aria-pressed={on} onClick={() => onToggle(s.tag)}
                className={clsx('card card-hover press flex h-full w-full flex-col p-4 text-left', on && 'ring-2 ring-accent')}>
                <div className="flex items-center justify-between">
                  <span className={clsx('flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-extrabold transition-colors', on ? 'bg-accent text-accent-ink' : 'bg-accent-soft text-accent')} aria-hidden>
                    {on ? <Check size={16} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="mono text-[12px] font-bold text-secondary">{count.toLocaleString('en-IN')} products</span>
                </div>
                <p className="mt-3 text-[18px] font-extrabold text-display">{TITLE[s.name] ?? s.name}</p>
                <p className="label mt-0.5 !text-accent">{s.when}</p>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-secondary">{s.what}</p>
                <span className="mt-3 text-[13px] font-bold text-primary">{on ? 'Showing this step' : 'Show products for this step'}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <aside className="card border-warning/40 bg-warning/5 p-5">
        <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-display"><ShieldAlert size={16} className="text-warning" aria-hidden />Honest timeline &amp; safety rules</h3>
        <ul className="mt-3 space-y-3 text-[13px] leading-relaxed text-primary">{RULES.map((r) => <li key={r} className="flex gap-2.5"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden />{r}</li>)}</ul>
      </aside>
    </div>
  );
}
