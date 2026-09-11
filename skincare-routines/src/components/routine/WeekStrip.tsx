import { clsx } from 'clsx';
import { DAYS, DAY_LABEL, type Day, type Step } from '../../schedule/model';

interface Props { steps: Step[]; day: Day | null; onChange: (day: Day | null) => void }

const TODAY: Day = DAYS[(new Date().getDay() + 6) % 7];

/** Loop-style day columns: one button per weekday with how many steps fall on it (AM + PM), plus "Week" to see everything. */
export function WeekStrip({ steps, day, onChange }: Props) {
  const counts = Object.fromEntries(DAYS.map((d) => [d, steps.filter((s) => s.days.includes(d)).length])) as Record<Day, number>;
  return (
    <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="radiogroup" aria-label="Show steps for">
      <DayButton on={day === null} label="Week" sub={`${steps.length}`} onClick={() => onChange(null)} />
      {DAYS.map((d) => (
        <DayButton key={d} on={day === d} label={DAY_LABEL[d]} sub={String(counts[d])} today={d === TODAY} onClick={() => onChange(d)} />
      ))}
    </div>
  );
}

function DayButton({ on, label, sub, today, onClick }: { on: boolean; label: string; sub: string; today?: boolean; onClick: () => void }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick} aria-label={`${label}${today ? ' (today)' : ''}, ${sub} steps`}
      className={clsx('press flex h-[60px] min-w-0 flex-1 flex-col items-center justify-center rounded-[12px] border text-[12px] font-bold transition-colors',
        on ? 'border-primary bg-primary text-page' : 'border-line bg-surface text-secondary hover:border-secondary')}>
      <span className={clsx(today && !on && 'text-accent')}>{label}</span>
      <span className={clsx('mono mt-0.5 text-[15px] font-extrabold', on ? 'text-page' : 'text-display')}>{sub}</span>
    </button>
  );
}
