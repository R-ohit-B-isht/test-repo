import { AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import type { PairingVerdict } from '../../../lib/types';
import type { RuleHit } from '../../../schedule/planner/rules';
import type { PlanWarning } from '../../../schedule/planner/scheduler';

interface Props { warnings: PlanWarning[]; rules: RuleHit[]; assistant: string[] }

const VERDICT: Record<PairingVerdict, { label: string; cls: string }> = {
  avoid: { label: 'Never same slot', cls: 'border-danger/40 bg-danger/5 text-danger' },
  caution: { label: 'Kept apart', cls: 'border-warning/50 bg-warning/10 text-primary' },
  fine: { label: 'Fine together', cls: 'border-line bg-raised/60 text-secondary' },
  synergy: { label: 'Works together', cls: 'border-success/40 bg-success/10 text-primary' },
  essential: { label: 'Essential pairing', cls: 'border-success/40 bg-success/10 text-primary' },
};

/** Compatibility review: what the planner could not honour, the pairing rules that shaped the week, and the assistant's
 * plan-level warnings — each labelled by where it came from. */
export function PlanWarnings({ warnings, rules, assistant }: Props) {
  if (!warnings.length && !rules.length && !assistant.length) return null;
  return (
    <section className="card p-4" aria-labelledby="compat-head">
      <h3 id="compat-head" className="flex items-center gap-2 text-[15px] font-extrabold text-display"><ShieldCheck size={15} className="text-accent" aria-hidden />Compatibility check</h3>
      {warnings.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {warnings.map((w, i) => (
            <li key={i} className={clsx('flex items-start gap-2 rounded-[10px] border px-3 py-2 text-[12.5px] leading-snug', w.kind === 'unplaced' || w.kind === 'rest' ? 'border-warning/50 bg-warning/10 text-primary' : 'border-line bg-raised/50 text-secondary')}>
              {w.kind === 'unplaced' || w.kind === 'rest' ? <AlertTriangle size={13} className="mt-0.5 shrink-0 text-warning" aria-hidden /> : <Info size={13} className="mt-0.5 shrink-0 text-muted" aria-hidden />}
              <span>{w.text}</span>
            </li>
          ))}
        </ul>
      )}
      {assistant.length > 0 && (
        <div className="mt-3">
          <p className="label">Assistant’s warnings</p>
          <ul className="mt-1.5 space-y-1.5">
            {assistant.map((w, i) => <li key={i} className="rounded-[10px] border border-accent/40 bg-accent-soft/40 px-3 py-2 text-[12.5px] leading-snug text-primary">{w}</li>)}
          </ul>
        </div>
      )}
      {rules.length > 0 && (
        <details className="mt-3 text-[12.5px]">
          <summary className="cursor-pointer font-bold text-primary">{rules.length} pairing rule{rules.length === 1 ? '' : 's'} shaped this week</summary>
          <ul className="mt-2 space-y-1.5">
            {rules.map((r) => (
              <li key={r.pair.join('+')} className={clsx('rounded-[10px] border px-3 py-2', VERDICT[r.verdict].cls)}>
                <span className="font-bold">{r.headline}</span>
                <span className="ml-1.5 text-[11px] font-bold uppercase tracking-wide opacity-80">{VERDICT[r.verdict].label}{r.sourced ? ' · sourced' : ' · general rule'}</span>
                <span className="block text-secondary">{r.how}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
