import { Check } from 'lucide-react';
import { clsx } from 'clsx';

export type PlanView = 'setup' | 'inventory' | 'plan' | 'routine';

const VIEWS: { id: PlanView; label: string; short: string }[] = [
  { id: 'setup', label: 'Who it is for', short: 'Setup' },
  { id: 'inventory', label: 'What you have', short: 'Have' },
  { id: 'plan', label: 'Your week', short: 'Week' },
  { id: 'routine', label: 'Your routine', short: 'Routine' },
];

interface Props {
  view: PlanView;
  /** Views the user may jump to (the plan view opens only once a week has been built). */
  reachable: ReadonlySet<PlanView>;
  onChange: (v: PlanView) => void;
}

/** MyFitnessPal-style segmented progress: one thin bar per stage, the current one filled, done ones ticked and tappable. */
export function PlanStepper({ view, reachable, onChange }: Props) {
  const at = VIEWS.findIndex((v) => v.id === view);
  return (
    <nav aria-label="Routine builder stages">
      <ol className="grid grid-cols-4 gap-1.5">
        {VIEWS.map((v, i) => {
          const done = i < at;
          const can = reachable.has(v.id);
          return (
            <li key={v.id} className="min-w-0">
              <button type="button" onClick={() => can && onChange(v.id)} disabled={!can} aria-current={v.id === view ? 'step' : undefined}
                className={clsx('press group block w-full rounded-[10px] px-1 py-1.5 text-left', can ? 'cursor-pointer hover:bg-raised' : 'cursor-default')}>
                <span className={clsx('block h-1 rounded-full transition-colors', v.id === view ? 'bg-accent' : done ? 'bg-primary' : 'bg-line')} aria-hidden />
                <span className={clsx('mt-1.5 flex items-center gap-1 text-[12px] font-bold', v.id === view ? 'text-display' : done ? 'text-primary' : 'text-muted')}>
                  {done && <Check size={11} aria-hidden />}
                  <span className="truncate"><span className="sm:hidden">{v.short}</span><span className="hidden sm:inline">{v.label}</span></span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
