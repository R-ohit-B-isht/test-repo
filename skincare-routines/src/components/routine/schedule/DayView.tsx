import { ArrowDownWideNarrow, CalendarRange, Moon, Plus, RotateCcw, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { StepCard } from '../StepCard';
import { byApplicationOrder } from '../../../schedule/applicationOrder';
import { doneOn, resetDone, toggleDone, useCompletion } from '../../../schedule/completionStore';
import { useMissing } from '../../../schedule/ownedStore';
import { weekMonday } from '../../../schedule/rotation';
import { DAY_LABEL, SLOT_LABEL, SLOTS, stepsFor, type Day, type Slot, type Step } from '../../../schedule/model';
import { longDate, type WeekDate } from '../../../schedule/week';

export interface StepActions {
  categoryLabel: (id: string) => string;
  onAdd: (slot: Slot) => void;
  onPlan: () => void;
  onEdit: (step: Step) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onSort: (slot: Slot) => void;
}

interface Props extends StepActions {
  steps: Step[];
  date: WeekDate;
  slot: Slot;
  onSlot: (slot: Slot) => void;
  onToday: () => void;
}

const SLOT_ICON = { am: Sun, pm: Moon } as const;
const isSorted = (list: Step[]) => byApplicationOrder(list).every((s, i) => s.id === list[i].id);

/** One day of the saved routine: AM / PM pill on phones, both columns side by side from lg up. Steps come straight from
 * `stepsFor` in stored order; ticking a step writes to the completion journal, never to the routine. */
export function DayView({ steps, date, slot, onSlot, onToday, ...actions }: Props) {
  const done = useCompletion();
  const missing = useMissing();
  const monday = weekMonday(date.date);
  const ticked = doneOn(done, date.key);
  const counts = Object.fromEntries(SLOTS.map((s) => [s, stepsFor(steps, s, date.day).length])) as Record<Slot, number>;
  return (
    <section aria-label={`${DAY_LABEL[date.day]} routine`}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="label">{date.isToday ? 'Today' : DAY_LABEL[date.day]}</p>
          <h3 className="mt-1 text-[22px] leading-tight text-display sm:text-[26px]">{longDate(date.date)}</h3>
        </div>
        {!date.isToday && <button type="button" className="btn h-9 text-[12px]" onClick={onToday}>Jump to today</button>}
      </div>

      <div className="sched-period mt-4 lg:hidden" role="group" aria-label="Morning or night">
        {SLOTS.map((s) => {
          const Icon = SLOT_ICON[s];
          return (
            <button key={s} type="button" className="press" aria-pressed={slot === s} onClick={() => onSlot(s)}>
              <Icon size={15} aria-hidden />{SLOT_LABEL[s]}<span className="mono text-[11px] opacity-70">{counts[s]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {SLOTS.map((s) => (
          <SlotList key={s} slot={s} day={date.day} dateKey={date.key} monday={monday} missing={missing} steps={steps} ticked={ticked} hiddenOnPhone={s !== slot} {...actions} />
        ))}
      </div>
    </section>
  );
}

interface SlotProps extends StepActions { slot: Slot; day: Day; dateKey: string; monday: string; missing: ReadonlySet<string>; steps: Step[]; ticked: Set<string>; hiddenOnPhone: boolean }

function SlotList({ slot, day, dateKey, monday, missing, steps, ticked, hiddenOnPhone, categoryLabel, onAdd, onPlan, onEdit, onRemove, onMove, onSort }: SlotProps) {
  const Icon = SLOT_ICON[slot];
  const list = stepsFor(steps, slot, day);
  const all = stepsFor(steps, slot, null);
  const doneCount = list.filter((s) => ticked.has(s.id)).length;
  return (
    <section aria-labelledby={`slot-${slot}`} className={clsx('min-w-0', hiddenOnPhone && 'hidden lg:block')}>
      <div className="flex items-center justify-between gap-3">
        <h4 id={`slot-${slot}`} className="flex items-center gap-2 text-[18px] text-display"><Icon size={17} className="text-accent" aria-hidden />{SLOT_LABEL[slot]}</h4>
        <span className="label mono">{list.length} step{list.length === 1 ? '' : 's'}</span>
      </div>
      {list.length === 0 ? (
        <div className="mt-3 rounded-[16px] border border-dashed border-line-strong px-5 py-8 text-center">
          <p className="text-[14px] font-bold text-display">{all.length ? `Nothing on ${DAY_LABEL[day]} ${SLOT_LABEL[slot].toLowerCase()}s` : `No ${SLOT_LABEL[slot].toLowerCase()} steps yet`}</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] text-secondary">
            {all.length ? 'Edit a step to add this day, or add one just for it.' : 'Add a step yourself, or build the week from what you have — nothing lands until you accept it.'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn" onClick={() => onAdd(slot)}><Plus size={14} aria-hidden />Add step</button>
            <button type="button" className="btn btn-accent" onClick={onPlan}><CalendarRange size={14} aria-hidden />Plan my week</button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 flex items-center gap-3">
            <div className="sched-progress flex-1" role="progressbar" aria-valuemin={0} aria-valuemax={list.length} aria-valuenow={doneCount} aria-label={`${SLOT_LABEL[slot]} steps done`}>
              <span style={{ width: `${(doneCount / list.length) * 100}%` }} />
            </div>
            <span className="mono text-[12px] font-bold text-secondary">{doneCount}/{list.length}</span>
            {doneCount > 0 && (
              <button type="button" onClick={() => resetDone(dateKey, list.map((s) => s.id))} className="press flex h-8 items-center gap-1 rounded-full px-2 text-[12px] font-bold text-secondary hover:bg-raised hover:text-display">
                <RotateCcw size={12} aria-hidden />Reset
              </button>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button type="button" onClick={() => onAdd(slot)} className="press flex h-10 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] font-bold text-display hover:bg-raised">
              <Plus size={14} aria-hidden />Add step
            </button>
            <button type="button" onClick={onPlan} className="press flex h-10 items-center gap-1.5 rounded-full border border-accent/40 px-3 text-[13px] font-bold text-accent hover:bg-raised">
              <CalendarRange size={14} aria-hidden />Plan more with assistant
            </button>
            {all.length > 1 && !isSorted(all) && (
              <button type="button" onClick={() => onSort(slot)} title="Cleanse → toner → serums → moisturiser → sunscreen"
                className="press flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold text-secondary hover:bg-raised hover:text-display">
                <ArrowDownWideNarrow size={14} aria-hidden />Sort by application order
              </button>
            )}
          </div>
          <ol className="mt-3 space-y-2.5">
            {list.map((s, i) => (
              <StepCard key={s.id} step={s} monday={monday} missing={missing} index={i} count={list.length} categoryLabel={categoryLabel} done={ticked.has(s.id)} onToggleDone={() => toggleDone(dateKey, s.id)}
                onEdit={() => onEdit(s)} onRemove={() => onRemove(s.id)} onMove={(dir) => onMove(s.id, dir)} />
            ))}
          </ol>
          <button type="button" onClick={() => onAdd(slot)} className="press mt-2.5 flex h-10 w-full items-center justify-center gap-1.5 rounded-[14px] border border-dashed border-line-strong text-[13px] font-bold text-secondary hover:bg-raised hover:text-display">
            <Plus size={14} aria-hidden />Add a {SLOT_LABEL[slot].toLowerCase()} step
          </button>
        </>
      )}
    </section>
  );
}
