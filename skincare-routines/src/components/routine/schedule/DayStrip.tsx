import { useEffect, useRef } from 'react';
import { DAY_LABEL, type Day, type Step } from '../../../schedule/model';
import type { WeekDate } from '../../../schedule/week';

interface Props { dates: WeekDate[]; steps: Step[]; selected: Day; onSelect: (day: Day) => void }

/** Seven-day strip with real dates: selected day in ink, today ringed, a dot when steps fall on the day. Scrolls
 * horizontally on narrow phones and reveals the selected day (reference site's personal-days behaviour). */
export function DayStrip({ dates, steps, selected, onSelect }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    const el = selectedRef.current;
    if (!strip || !el) return;
    const reveal = () => {
      const bounds = strip.getBoundingClientRect();
      const mine = el.getBoundingClientRect();
      if (mine.left < bounds.left) strip.scrollBy({ left: mine.left - bounds.left });
      else if (mine.right > bounds.right) strip.scrollBy({ left: mine.right - bounds.right });
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [selected]);

  return (
    <div ref={stripRef} className="sched-days" role="group" aria-label="Pick a day">
      {dates.map(({ day, date, isToday }) => {
        const count = steps.filter((s) => s.days.includes(day)).length;
        return (
          <button key={day} ref={selected === day ? selectedRef : null} type="button" className="sched-day press" aria-pressed={selected === day}
            aria-current={isToday ? 'date' : undefined} data-has={count > 0} onClick={() => onSelect(day)}
            aria-label={`${DAY_LABEL[day]} ${date.getDate()}${isToday ? ', today' : ''}, ${count} step${count === 1 ? '' : 's'}`}>
            <span>{DAY_LABEL[day]}</span>
            <strong>{date.getDate()}</strong>
            <span className="sched-day-dot" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
