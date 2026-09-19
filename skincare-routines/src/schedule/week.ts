/** Calendar helpers for the schedule views: the Mon–Sun week around a date, and the routine `Day` a Date falls on. */
import { DAYS, type Day } from './model';

export interface WeekDate { day: Day; date: Date; key: string; isToday: boolean }

/** Local `YYYY-MM-DD`. */
export const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const dayOf = (d: Date): Day => DAYS[(d.getDay() + 6) % 7];

/** The seven dates of the week containing `now`, Monday first. */
export function weekDates(now = new Date()): WeekDate[] {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const today = dateKey(now);
  return DAYS.map((day, i) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = dateKey(date);
    return { day, date, key, isToday: key === today };
  });
}

export const longDate = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
