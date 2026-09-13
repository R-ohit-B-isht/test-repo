import { CalendarRange, Moon, Plus, Sun } from 'lucide-react';
import { StepCard } from './StepCard';
import { DAY_LABEL, SLOT_LABEL, SLOTS, stepsFor, type Day, type Slot, type Step } from '../../schedule/model';

interface Props {
  steps: Step[];
  day: Day | null;
  categoryLabel: (id: string) => string;
  onAdd: (slot: Slot) => void;
  onPlan: () => void;
  onEdit: (step: Step) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}

const SLOT_ICON = { am: Sun, pm: Moon } as const;

/** Morning / Night columns (Headspace timeline, Todoist grouped list): accepted steps only, in order, for the chosen day or the whole week. */
export function Timeline({ steps, day, categoryLabel, onAdd, onPlan, onEdit, onRemove, onMove }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {SLOTS.map((slot) => {
        const Icon = SLOT_ICON[slot];
        const list = stepsFor(steps, slot, day);
        const all = stepsFor(steps, slot, null);
        return (
          <section key={slot} aria-labelledby={`slot-${slot}`} className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <h3 id={`slot-${slot}`} className="flex items-center gap-2 text-[20px] text-display"><Icon size={18} className="text-accent" aria-hidden />{SLOT_LABEL[slot]}</h3>
              <span className="label mono">{day ? `${list.length} on ${DAY_LABEL[day]}` : `${list.length} step${list.length === 1 ? '' : 's'}`}</span>
            </div>
            {list.length === 0 ? (
              <div className="mt-3 rounded-[16px] border border-dashed border-line-strong px-5 py-8 text-center">
                <p className="text-[14px] font-bold text-display">{day && all.length ? `Nothing on ${DAY_LABEL[day]} ${SLOT_LABEL[slot].toLowerCase()}s` : `No ${SLOT_LABEL[slot].toLowerCase()} steps yet`}</p>
                <p className="mx-auto mt-1 max-w-xs text-[13px] text-secondary">
                  {day && all.length ? 'Edit a step to add this day, or add one just for it.' : 'Add a step yourself, or build the week from what you have — nothing lands until you accept it.'}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button type="button" className="btn" onClick={() => onAdd(slot)}><Plus size={14} aria-hidden />Add step</button>
                  <button type="button" className="btn btn-accent" onClick={onPlan}><CalendarRange size={14} aria-hidden />Plan my week</button>
                </div>
              </div>
            ) : (
              <>
                <ol className="mt-3 space-y-2.5">
                  {list.map((s, i) => (
                    <StepCard key={s.id} step={s} index={i} count={list.length} categoryLabel={categoryLabel}
                      onEdit={() => onEdit(s)} onRemove={() => onRemove(s.id)} onMove={(dir) => onMove(s.id, dir)} />
                  ))}
                </ol>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onAdd(slot)} className="press flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold text-secondary hover:bg-raised hover:text-display">
                    <Plus size={14} aria-hidden />Add step
                  </button>
                  <button type="button" onClick={onPlan} className="press flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold text-accent hover:bg-raised">
                    <CalendarRange size={14} aria-hidden />Plan more
                  </button>
                </div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
