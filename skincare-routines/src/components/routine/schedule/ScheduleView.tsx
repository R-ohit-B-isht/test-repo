import { useState } from 'react';
import { BellRing, CalendarDays, NotebookPen, ShoppingBag, Sun } from 'lucide-react';
import { DayStrip } from './DayStrip';
import { DayView, type StepActions } from './DayView';
import { NotesPanel } from './NotesPanel';
import { RemindersPanel } from './RemindersPanel';
import { Shelf } from './Shelf';
import { WeekOverview } from './WeekOverview';
import type { Day, Slot, Step } from '../../../schedule/model';
import { weekMonday } from '../../../schedule/rotation';
import { dayOf, weekDates } from '../../../schedule/week';

export type View = 'today' | 'week' | 'shelf' | 'notes' | 'remind';
const VIEWS: { id: View; label: string; Icon: typeof Sun }[] = [
  { id: 'today', label: 'Today', Icon: Sun },
  { id: 'week', label: 'Full week', Icon: CalendarDays },
  { id: 'shelf', label: 'Shelf', Icon: ShoppingBag },
  { id: 'notes', label: 'Notes', Icon: NotebookPen },
  { id: 'remind', label: 'Remind', Icon: BellRing },
];

interface Props extends StepActions {
  steps: Step[];
  /** From a tapped reminder (`/#/routine?slot=pm`): open Today on that slot instead of guessing from the clock. */
  initialSlot?: Slot | null;
  initialView?: View | null;
}

/** The accepted routine as the reference site shows it on a phone: Today (day strip + AM/PM) · Full week · Shelf · Notes,
 * switched by a pill row that becomes a fixed bottom bar under 640px. Every view is a projection of the same saved steps. */
export function ScheduleView({ steps, initialSlot = null, initialView = null, ...actions }: Props) {
  const [view, setView] = useState<View>(initialView ?? 'today');
  const [now] = useState(() => new Date());
  const [day, setDay] = useState<Day>(() => dayOf(now));
  const [slot, setSlot] = useState<Slot>(() => initialSlot ?? (now.getHours() >= 15 ? 'pm' : 'am'));
  const dates = weekDates(now);
  const date = dates.find((d) => d.day === day) ?? dates[0];
  const open = (d: Day, s: Slot) => { setDay(d); setSlot(s); setView('today'); };

  return (
    <div className="sched-pad-bottom">
      <nav className="sched-views sm:mb-5" aria-label="Routine views">
        {VIEWS.map(({ id, label, Icon }) => (
          <button key={id} type="button" className="press" aria-pressed={view === id} onClick={() => setView(id)}>
            <Icon size={16} aria-hidden />{label}
          </button>
        ))}
      </nav>
      {view === 'today' && (
        <div className="space-y-5">
          <DayStrip dates={dates} steps={steps} selected={day} onSelect={setDay} />
          <DayView steps={steps} date={date} slot={slot} onSlot={setSlot} onToday={() => setDay(dayOf(now))} {...actions} />
        </div>
      )}
      {view === 'week' && <WeekOverview steps={steps} dates={dates} categoryLabel={actions.categoryLabel} onOpen={open} onEdit={actions.onEdit} />}
      {view === 'shelf' && <Shelf steps={steps} monday={weekMonday(now)} categoryLabel={actions.categoryLabel} />}
      {view === 'notes' && <NotesPanel />}
      {view === 'remind' && <RemindersPanel steps={steps} />}
    </div>
  );
}
