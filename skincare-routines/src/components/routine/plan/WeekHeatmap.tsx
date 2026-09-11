import { Moon, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { DAYS, DAY_LABEL, SLOTS, SLOT_LABEL, type Day, type Slot } from '../../../schedule/model';
import type { Role } from '../../../schedule/planner/catalog';
import type { PlanStep, WeekPlan } from '../../../schedule/planner/scheduler';

interface Props {
  week: WeekPlan;
  day: Day | null;
  onDay: (d: Day | null) => void;
}

const ROLE_DOT: Record<Role, string> = { core: 'bg-line-strong', protect: 'bg-warning', hydrate: 'bg-face', treat: 'bg-primary', active: 'bg-accent' };
const SLOT_ICON = { am: Sun, pm: Moon } as const;
const TODAY: Day = DAYS[(new Date().getDay() + 6) % 7];

/** Loop-style frequency grid: Mon–Sun columns × AM/PM rows. Each cell lists that slot's steps as coloured dots (accent =
 * strong active, so the "one per night" spacing is visible at a glance); rest nights are blank and labelled. */
export function WeekHeatmap({ week, day, onDay }: Props) {
  const byId = new Map(week.steps.map((s) => [s.id, s]));
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-[28px_repeat(7,minmax(0,1fr))] gap-px bg-line text-[11px]" role="grid" aria-label="Week at a glance">
        <div className="bg-surface" role="columnheader" aria-hidden />
        {DAYS.map((d) => (
          <button key={d} type="button" role="columnheader" aria-pressed={day === d} onClick={() => onDay(day === d ? null : d)}
            className={clsx('press flex h-9 flex-col items-center justify-center font-bold uppercase tracking-wide transition-colors', day === d ? 'bg-primary text-page' : 'bg-surface text-secondary hover:bg-raised', d === TODAY && day !== d && 'text-accent')}>
            {DAY_LABEL[d]}
            {week.restNights.includes(d) && <span className="text-[9px] font-semibold normal-case tracking-normal opacity-80">rest</span>}
          </button>
        ))}
        {SLOTS.map((slot) => {
          const Icon = SLOT_ICON[slot];
          return [
            <div key={`${slot}-h`} role="rowheader" className="flex items-center justify-center bg-surface text-secondary" aria-label={SLOT_LABEL[slot]}><Icon size={13} aria-hidden /></div>,
            ...DAYS.map((d) => <Cell key={`${slot}-${d}`} slot={slot} day={d} steps={week.cells[d][slot].map((id) => byId.get(id)).filter((s): s is PlanStep => !!s)} dim={day !== null && day !== d} rest={slot === 'pm' && week.restNights.includes(d)} />),
          ];
        })}
      </div>
      <p className="flex flex-wrap gap-x-3 gap-y-1 border-t border-line px-3 py-2 text-[11px] font-semibold text-secondary">
        {(['active', 'treat', 'hydrate', 'protect', 'core'] as Role[]).map((r) => (
          <span key={r} className="inline-flex items-center gap-1"><span className={clsx('h-2 w-2 rounded-full', ROLE_DOT[r])} aria-hidden />{ROLE_LABEL[r]}</span>
        ))}
      </p>
    </div>
  );
}

const ROLE_LABEL: Record<Role, string> = { core: 'daily basics', protect: 'sunscreen', hydrate: 'hydrate', treat: 'treatment', active: 'strong active' };

function Cell({ slot, day, steps, dim, rest }: { slot: Slot; day: Day; steps: PlanStep[]; dim: boolean; rest: boolean }) {
  const actives = steps.filter((s) => s.role === 'active');
  const label = `${DAY_LABEL[day]} ${SLOT_LABEL[slot]}: ${steps.length ? steps.map((s) => s.label).join(', ') : rest ? 'rest night' : 'nothing planned'}`;
  return (
    <div role="gridcell" aria-label={label} className={clsx('flex min-h-[52px] flex-col items-center justify-center gap-1 bg-surface px-1 py-1.5 transition-opacity', dim && 'opacity-40')}>
      {steps.length ? (
        <>
          <span className="flex max-w-full flex-wrap justify-center gap-[3px]">
            {steps.map((s) => <span key={s.id} className={clsx('h-2 w-2 rounded-full', ROLE_DOT[s.role])} aria-hidden />)}
          </span>
          {actives.length > 0 && <span className="max-w-full truncate text-[10px] font-bold text-display">{actives.map((a) => a.label).join(' · ')}</span>}
        </>
      ) : (
        <span className="text-[10px] font-semibold text-muted">{rest ? 'rest' : '—'}</span>
      )}
    </div>
  );
}
