import { ArrowRight, Moon, Sun } from 'lucide-react';
import { MORNING, PERSONAL_WEEK } from '../../data/personalSchedule';
import { localDate } from '../../state/usePersonalProgress';
import { PersonalSteps } from './PersonalSteps';

export function PersonalWeek({ onSelect }: { onSelect: (day: number) => void }) {
  return (
    <aside className="personal-week card">
      <p className="label">Your weekly rhythm</p>
      <h2 className="mt-2 text-[24px] text-display">A place for every active.</h2>
      <p className="mt-2 text-[13px] text-secondary">One morning routine. A different focus each night.</p>
      <div className="mt-6 flex items-center gap-3 border-b border-line pb-4">
        <Sun size={18} className="text-accent" aria-hidden />
        <div><p className="text-[14px] font-bold text-display">Every morning</p><p className="text-[12px] text-secondary">Hydrate, clarify, protect</p></div>
      </div>
      <ol className="mt-2 divide-y divide-line">
        {PERSONAL_WEEK.map((day, i) => (
          <li key={day.name}><button type="button" onClick={() => onSelect(i)} className="group flex min-h-16 w-full items-center gap-3 py-3 text-left">
            <span className="mono w-8 shrink-0 text-[12px] text-muted">{day.short}</span>
            <span className="min-w-0 flex-1"><span className="block text-[13px] font-bold text-display">{day.theme}</span><span className="text-[12px] text-secondary">{day.focus}</span></span>
            <ArrowRight size={14} className="text-accent" aria-hidden />
          </button></li>
        ))}
      </ol>
      <p className="mt-4 border-t border-line pt-4 text-[12px] leading-relaxed text-secondary">Body care: 20% urea on Monday, Wednesday and Friday. Your foot product stays separate from face care.</p>
    </aside>
  );
}

export function PersonalDayStrip({ dates, selected, today, onSelect }: {
  dates: Date[]; selected: number; today: Date; onSelect: (day: number) => void;
}) {
  return (
    <div className="personal-days" role="group" aria-label="Day of the week">
      {PERSONAL_WEEK.map((day, index) => (
        <button type="button" key={day.name} className="personal-day press" aria-pressed={selected === index}
          aria-current={localDate(dates[index]) === localDate(today) ? 'date' : undefined}
          aria-label={`${day.name}, ${dates[index].toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}: ${day.theme}`}
          onClick={() => onSelect(index)}>
          <span>{day.short}</span><strong>{dates[index].getDate()}</strong><span className="personal-day-dot" aria-hidden />
        </button>
      ))}
    </div>
  );
}

export function FullWeek() {
  return (
    <div className="space-y-4">
      <div className="mb-6"><p className="label">The complete schedule</p><h2 className="mt-2 text-[28px] text-display">Your week, step by step.</h2></div>
      <details className="personal-overview card" open>
        <summary><Sun size={18} aria-hidden /><span>Daily morning <span className="text-secondary">· {MORNING.length} steps</span></span></summary>
        <PersonalSteps steps={MORNING} />
      </details>
      {PERSONAL_WEEK.map((day) => <details className="personal-overview card" key={day.name}>
        <summary><Moon size={18} aria-hidden /><span>{day.name} <span className="font-medium text-secondary">· {day.theme}</span></span></summary>
        <PersonalSteps steps={day.steps} />
      </details>)}
    </div>
  );
}
