import { useState } from 'react';
import { CalendarDays, NotebookPen, ShoppingBag, Sun } from 'lucide-react';
import { DayStrip } from './DayStrip';
import { DayView, type StepActions } from './DayView';
import { NotesPanel } from './NotesPanel';
import { Shelf } from './Shelf';
import { WeekOverview } from './WeekOverview';
import type { Day, Slot, Step } from '../../../schedule/model';
import { dayOf, weekDates } from '../../../schedule/week';

type View = 'today' | 'week' | 'shelf' | 'notes';
const VIEWS: { id: View; label: string; Icon: typeof Sun }[] = [
  { id: 'today', label: 'Today', Icon: Sun },
  { id: 'week', label: 'Full week', Icon: CalendarDays },
  { id: 'shelf', label: 'Shelf', Icon: ShoppingBag },
  { id: 'notes', label: 'Notes', Icon: NotebookPen },
];

interface Props extends StepActions { steps: Step[] }

/** The accepted routine as the reference site shows it on a phone: Today (day strip + AM/PM) · Full week · Shelf · Notes,
 * switched by a pill row that becomes a fixed bottom bar under 640px. Every view is a projection of the same saved steps. */
export function ScheduleView({ steps, ...actions }: Props) {
  const [view, setView] = useState<View>('today');
  const [now] = useState(() => new Date());
  const [day, setDay] = useState<Day>(() => dayOf(now));
  const [slot, setSlot] = useState<Slot>(() => (now.getHours() >= 15 ? 'pm' : 'am'));
  const dates = weekDates(now);
  const date = dates.find((d) => d.day === day) ?? dates[0];
  const open = (d: Day, s: Slot) => { setDay(d); setSlot(s); setView('today'); };

  return (
    <div className="sched-pad-bottom space-y-5">
      <nav className="sched-views" aria-label="Routine views">
        {VIEWS.map(({ id, label, Icon }) => (
          <button key={id} type="button" className="press" aria-pressed={view === id} onClick={() => setView(id)}>
            <Icon size={16} aria-hidden />{label}
          </button>
        ))}
      </nav>
      {view === 'today' && (
        <>
          <DayStrip dates={dates} steps={steps} selected={day} onSelect={setDay} />
          <DayView steps={steps} date={date} slot={slot} onSlot={setSlot} onToday={() => setDay(dayOf(now))} {...actions} />
        </>
      )}
      {view === 'week' && <WeekOverview steps={steps} dates={dates} categoryLabel={actions.categoryLabel} onOpen={open} />}
      {view === 'shelf' && <Shelf steps={steps} categoryLabel={actions.categoryLabel} />}
      {view === 'notes' && <NotesPanel />}
    </div>
  );
}
