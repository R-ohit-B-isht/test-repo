import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BellRing, CalendarDays, NotebookPen, ShoppingBag, Sun } from 'lucide-react';
import { DayStrip } from './DayStrip';
import { DayView, type StepActions } from './DayView';
import { NotesPanel } from './NotesPanel';
import { RemindersPanel } from './RemindersPanel';
import { Shelf } from './Shelf';
import { WeekOverview } from './WeekOverview';
import { areaCounts, stepsInArea } from '../../../schedule/area';
import { AREA_LABEL, AREAS, isArea, type Area, type Day, type PlanZone, type Slot, type Step } from '../../../schedule/model';
import { weekMonday } from '../../../schedule/rotation';
import { loadViewPrefs, saveViewPrefs } from '../../../schedule/viewPrefs';
import { dayOf, weekDates } from '../../../schedule/week';

export type View = 'today' | 'week' | 'shelf' | 'notes' | 'remind';
const VIEWS: { id: View; label: string; Icon: typeof Sun }[] = [
  { id: 'today', label: 'Today', Icon: Sun },
  { id: 'week', label: 'Full week', Icon: CalendarDays },
  { id: 'shelf', label: 'Shelf', Icon: ShoppingBag },
  { id: 'notes', label: 'Notes', Icon: NotebookPen },
  { id: 'remind', label: 'Remind', Icon: BellRing },
];

/** A step added while a tab is open starts in that tab's zone (hair → scalp; the editor lets you pick lengths / beard). */
const ZONE_FOR_AREA: Record<Area, PlanZone> = { face: 'face', body: 'body', hair: 'scalp', oral: 'oral', other: 'other' };

/** Views the area tabs filter: everything that lists steps or their products. Notes and reminders are whole-routine. */
const AREA_VIEWS = new Set<View>(['today', 'week', 'shelf']);

interface Props extends Omit<StepActions, 'onAdd'> {
  steps: Step[];
  /** `zone` is the open tab's zone, or null for the routine's own default when every area is showing. */
  onAdd: (slot: Slot, zone: PlanZone | null) => void;
  /** From a tapped reminder (`/#/routine?slot=pm`): open Today on that slot instead of guessing from the clock. */
  initialSlot?: Slot | null;
  initialView?: View | null;
}

/** The accepted routine as the reference site shows it on a phone: Today (day strip + AM/PM) · Full week · Shelf · Notes,
 * switched by a pill row that becomes a fixed bottom bar under 640px. Every view is a projection of the same saved steps.
 * A second row of tabs — All · Face · Body · Hair · Teeth · Other — narrows Today, Full week and Shelf to one body area,
 * read from each step at render time so the saved routine is never rewritten; an empty part still opens so a step can be
 * added straight into it. The view and part last opened are remembered (`ledger.routine.view.v1`) and restored next time. */
export function ScheduleView({ steps, initialSlot = null, initialView = null, onAdd, ...actions }: Props) {
  const [prefs] = useState(loadViewPrefs);
  const [view, setView] = useState<View>(initialView ?? prefs.view ?? 'today');
  const [now] = useState(() => new Date());
  const [day, setDay] = useState<Day>(() => dayOf(now));
  const [slot, setSlot] = useState<Slot>(() => initialSlot ?? (now.getHours() >= 15 ? 'pm' : 'am'));
  const [params, setParams] = useSearchParams();
  const dates = weekDates(now);
  const date = dates.find((d) => d.day === day) ?? dates[0];
  const open = (d: Day, s: Slot) => { setDay(d); setSlot(s); setView('today'); };

  const counts = useMemo(() => areaCounts(steps), [steps]);
  const [area, setAreaState] = useState<Area | null>(() => {
    const requested = params.get('area');
    return isArea(requested) ? requested : requested === null ? prefs.area : null;
  });
  const setArea = (a: Area | null) => {
    setAreaState(a);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (a) next.set('area', a); else next.delete('area');
      return next;
    }, { replace: true });
  };
  useEffect(() => { saveViewPrefs({ view, area }); }, [view, area]);
  const shown = useMemo(() => stepsInArea(steps, area), [steps, area]);
  const add = (s: Slot) => onAdd(s, area ? ZONE_FOR_AREA[area] : null);

  return (
    <div className="sched-pad-bottom">
      <nav className="sched-views sm:mb-5" aria-label="Routine views">
        {VIEWS.map(({ id, label, Icon }) => (
          <button key={id} type="button" className="press" aria-pressed={view === id} onClick={() => setView(id)}>
            <Icon size={16} aria-hidden />{label}
          </button>
        ))}
      </nav>
      {AREA_VIEWS.has(view) && (
        <div className="sched-areas mb-5" role="group" aria-label="Which part of the routine">
          <button type="button" className="chip h-9" aria-pressed={area === null} onClick={() => setArea(null)}>
            All <span className="chip-count mono text-[11px]">{steps.length}</span>
          </button>
          {AREAS.map((a) => (
            <button key={a} type="button" className={`chip h-9${counts[a] ? '' : ' sched-area-empty'}`} aria-pressed={area === a} onClick={() => setArea(a)}>
              {AREA_LABEL[a]} <span className="chip-count mono text-[11px]">{counts[a]}</span>
            </button>
          ))}
        </div>
      )}
      {view === 'today' && (
        <div className="space-y-5">
          <DayStrip dates={dates} steps={shown} selected={day} onSelect={setDay} />
          <DayView steps={shown} date={date} slot={slot} onSlot={setSlot} onToday={() => setDay(dayOf(now))} onAdd={add} {...actions} />
        </div>
      )}
      {view === 'week' && <WeekOverview steps={shown} dates={dates} categoryLabel={actions.categoryLabel} onOpen={open} onEdit={actions.onEdit} />}
      {view === 'shelf' && <Shelf steps={shown} monday={weekMonday(now)} categoryLabel={actions.categoryLabel} />}
      {view === 'notes' && <NotesPanel />}
      {view === 'remind' && <RemindersPanel steps={steps} />}
    </div>
  );
}
