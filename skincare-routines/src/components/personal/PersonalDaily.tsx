import { Moon, RotateCcw, Sun } from 'lucide-react';
import { MORNING, PERSONAL_WEEK } from '../../data/personalSchedule';
import { localDate, usePersonalProgress, weekDates } from '../../state/usePersonalProgress';
import { PersonalDayStrip } from './PersonalWeek';
import { PersonalSteps } from './PersonalSteps';

export function PersonalDaily({ day, onDay, period, onPeriod }: {
  day: number; onDay: (day: number) => void; period: 'am' | 'pm'; onPeriod: (period: 'am' | 'pm') => void;
}) {
  const { today, progress, error, update } = usePersonalProgress();
  const dates = weekDates(today);
  const plan = PERSONAL_WEEK[day];
  const steps = period === 'am' ? MORNING : plan.steps;
  const key = `${localDate(dates[day])}:${period}`;
  const completed = (progress[key] ?? []).filter((id) => steps.some((step) => step.id === id));
  const toggle = (id: string) => update(key, completed.includes(id) ? completed.filter((item) => item !== id) : [...completed, id]);
  return (
    <section aria-label="Daily routine">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="label">Week of {dates[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <button type="button" className="text-[13px] font-bold text-accent" onClick={() => onDay((today.getDay() + 6) % 7)}>Jump to today</button>
      </div>
      <PersonalDayStrip dates={dates} today={today} selected={day} onSelect={onDay} />
      <div className="personal-period" role="group" aria-label="Time of day">
        <button type="button" aria-pressed={period === 'am'} onClick={() => onPeriod('am')}><Sun size={16} aria-hidden />Morning <span>AM</span></button>
        <button type="button" aria-pressed={period === 'pm'} onClick={() => onPeriod('pm')}><Moon size={16} aria-hidden />Evening <span>PM</span></button>
      </div>
      <div className="personal-session-heading">
        <div><p className="label">{plan.name} · {period === 'am' ? 'The daily foundation' : plan.focus}</p>
          <h2>{period === 'am' ? 'Good morning, skin.' : plan.theme}</h2></div>
        <span className="personal-count">{steps.length} steps</span>
      </div>
      <div className="personal-progress">
        <label htmlFor="personal-progress">{completed.length === steps.length ? 'All checked. A little care, done.' : `${completed.length} of ${steps.length} steps checked`}</label>
        <button type="button" disabled={completed.length === 0} onClick={() => update(key, [])} aria-label="Reset checks for this routine"><RotateCcw size={12} aria-hidden />Reset</button>
        <progress id="personal-progress" max={steps.length} value={completed.length} />
      </div>
      <p className="mb-6 text-[12px] text-muted">{error ?? 'Checks are saved by date in this browser only. Skip anything that does not suit your skin.'}</p>
      <div key={`${day}:${period}`} className="personal-enter"><PersonalSteps steps={steps} completed={completed} onToggle={toggle} /></div>
      <p role="status" className="sr-only">{completed.length} of {steps.length} steps checked</p>
    </section>
  );
}
