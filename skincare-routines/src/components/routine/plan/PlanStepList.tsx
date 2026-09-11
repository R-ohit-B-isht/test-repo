import { Check, Moon, Send, Sparkles, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { ProductSnippet } from '../ProductSnippet';
import { daysSummary, SLOTS, SLOT_LABEL, ZONE_LABEL, type Day } from '../../../schedule/model';
import type { Role } from '../../../schedule/planner/catalog';
import type { PickResult } from '../../../schedule/planner/picker';
import type { Review } from '../../../schedule/planner/review';
import type { PlanStep, WeekPlan } from '../../../schedule/planner/scheduler';

interface Props {
  week: WeekPlan;
  picks: Record<string, PickResult>;
  picking: boolean;
  review: Review | null;
  proposed: Set<string>;
  day: Day | null;
  categoryLabel: (id: string) => string;
  effectivePick: (stepId: string) => PickResult['chosen'];
  onChoose: (stepId: string, productId: string) => void;
  onPropose: (stepIds: string[]) => void;
}

const SLOT_ICON = { am: Sun, pm: Moon } as const;
const ROLE_BADGE: Record<Role, string> = { core: 'bg-raised text-secondary', protect: 'bg-warning/15 text-primary', hydrate: 'bg-face/15 text-primary', treat: 'bg-primary/10 text-primary', active: 'bg-accent-soft text-accent' };
const ROLE_NAME: Record<Role, string> = { core: 'basic', protect: 'protect', hydrate: 'hydrate', treat: 'treatment', active: 'active' };

/** Stage 3 body: AM / PM groups (Headspace timeline) of planned steps. Each row shows the day pattern, the ranked pick with
 * its alternatives, the assistant's note when it filed one, and a Propose button; the header sends a whole slot at once. */
export function PlanStepList({ week, picks, picking, review, proposed, day, categoryLabel, effectivePick, onChoose, onPropose }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {SLOTS.map((slot) => {
        const Icon = SLOT_ICON[slot];
        const steps = week.steps.filter((s) => s.slot === slot && (day === null || s.days.includes(day)));
        const todo = steps.filter((s) => !proposed.has(s.id)).map((s) => s.id);
        return (
          <section key={slot} aria-labelledby={`plan-${slot}`} className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 id={`plan-${slot}`} className="flex items-center gap-2 text-[20px] text-display"><Icon size={18} className="text-accent" aria-hidden />{SLOT_LABEL[slot]}<span className="mono text-[13px] font-semibold text-muted">{steps.length}</span></h3>
              {todo.length > 0 && !picking && (
                <button type="button" className="btn h-9" onClick={() => onPropose(todo)}><Send size={13} aria-hidden />Send {todo.length === steps.length ? 'all' : todo.length} to routine</button>
              )}
            </div>
            {steps.length === 0 ? (
              <p className="mt-3 rounded-[12px] border border-dashed border-line px-4 py-5 text-[13px] text-secondary">{day ? `Nothing in the ${SLOT_LABEL[slot].toLowerCase()} on ${day === null ? '' : daysSummary([day])}${slot === 'pm' && week.restNights.includes(day) ? ' — a rest night.' : '.'}` : `No ${SLOT_LABEL[slot].toLowerCase()} steps in this plan.`}</p>
            ) : (
              <ol className="mt-3 space-y-2.5">
                {steps.map((s, i) => (
                  <StepRow key={s.id} index={i + 1} step={s} pick={picks[s.id]} picking={picking && !picks[s.id]} note={review?.notes[s.id] ?? null}
                    chosen={effectivePick(s.id)} done={proposed.has(s.id)} categoryLabel={categoryLabel} onChoose={(id) => onChoose(s.id, id)} onPropose={() => onPropose([s.id])} />
                ))}
              </ol>
            )}
          </section>
        );
      })}
    </div>
  );
}

interface RowProps {
  index: number; step: PlanStep; pick: PickResult | undefined; picking: boolean; note: { why: string; pickId: string | null } | null;
  chosen: PickResult['chosen']; done: boolean; categoryLabel: (id: string) => string; onChoose: (productId: string) => void; onPropose: () => void;
}

function StepRow({ index, step, pick, picking, note, chosen, done, categoryLabel, onChoose, onPropose }: RowProps) {
  const alternatives = pick?.candidates.filter((c) => c.id !== chosen?.id) ?? [];
  return (
    <li className={clsx('fade-in rounded-[14px] border p-4', done ? 'border-line bg-surface' : 'border-dashed border-accent/50 bg-accent-soft/30')}>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="mono text-[12px] font-bold text-muted">{index}</span>
        <p className="text-[15px] font-extrabold text-display">{step.label}</p>
        <span className={clsx('rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide', ROLE_BADGE[step.role])}>{ROLE_NAME[step.role]}</span>
        <span className="label">{step.days.length === 7 ? 'Daily' : daysSummary(step.days)} · {ZONE_LABEL[step.zone]}{step.category ? ` · ${categoryLabel(step.category)}` : ''}</span>
      </div>
      {(step.hint || step.carries.length > 0 || step.notes.length > 0) && (
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-secondary">
          {step.hint}{step.carries.length ? ` Carries ${step.carries.join(', ')} — look for them on the label of this pick.` : ''}{step.notes.length ? ` ${step.notes.join(' ')}` : ''}
        </p>
      )}
      {note?.why && (
        <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-primary"><Sparkles size={12} className="mt-0.5 shrink-0 text-accent" aria-hidden /><span>{note.why}{note.pickId ? ' (assistant swapped the pick — shown below.)' : ''}</span></p>
      )}

      <div className="mt-3">
        {picking ? (
          <p className="flex items-center gap-2 text-[12.5px] font-semibold text-secondary"><span className="chat-dots" aria-hidden><i /><i /><i /></span>Looking up ranked listings…</p>
        ) : chosen ? (
          <>
            <ProductSnippet product={chosen} categoryLabel={categoryLabel} />
            {pick?.how && <p className="mt-1.5 text-[11.5px] text-muted">{pick.how}{pick.relaxed.length ? ` Relaxed: ${pick.relaxed.join(', ')}.` : ''}</p>}
            {alternatives.length > 0 && (
              <details className="mt-1.5 text-[12px]">
                <summary className="cursor-pointer font-bold text-secondary">Other ranked options ({alternatives.length})</summary>
                <ul className="mt-1.5 space-y-1">
                  {alternatives.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 rounded-[10px] border border-line px-2.5 py-1.5">
                      <span className="min-w-0 truncate text-[12px] text-primary">{c.brand ? `${c.brand} · ` : ''}{c.title}<span className="text-muted"> · #{c.rank}{c.priceInr != null ? ` · ₹${c.priceInr.toLocaleString('en-IN')}` : ''}</span></span>
                      <button type="button" className="btn h-7 shrink-0 px-2.5 text-[11.5px]" disabled={done} onClick={() => onChoose(c.id)}>Use this</button>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        ) : (
          <p className="rounded-[12px] border border-dashed border-line-strong px-3 py-2 text-[12.5px] text-secondary">
            No listing pinned — {pick?.error ? `lookup failed: ${pick.error}` : pick?.how || 'no ranked page for this step yet'}. You can still add it and pick a product later.
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {done ? (
          <span className="inline-flex h-9 items-center gap-1.5 text-[12.5px] font-bold text-success"><Check size={14} aria-hidden />Sent to your routine — accept it there</span>
        ) : (
          <button type="button" className="btn btn-primary h-9" onClick={onPropose} disabled={picking}><Send size={13} aria-hidden />Propose</button>
        )}
      </div>
    </li>
  );
}
