import type { ReactNode } from 'react';
import { ChevronDown, Moon, Sun } from 'lucide-react';
import { DAY_LABEL, DAYS, SLOTS, stepsFor, type Day, type Slot, type Step } from '../../../schedule/model';
import type { WeekDate } from '../../../schedule/week';

interface Props { steps: Step[]; dates: WeekDate[]; categoryLabel: (id: string) => string; onOpen: (day: Day, slot: Slot) => void }

const SLOT_ICON = { am: Sun, pm: Moon } as const;
const isDaily = (s: Step) => s.days.length === 7;

/** "Your week, step by step": the every-day blocks once, then each day's extras — all read live from the saved steps in
 * stored order (reference site's expandable overview). Tapping a row opens that day and slot in the daily view. */
export function WeekOverview({ steps, dates, categoryLabel, onOpen }: Props) {
  const daily = SLOTS.map((slot) => ({ slot, list: stepsFor(steps, slot, null).filter(isDaily) }));
  const today = (dates.find((d) => d.isToday) ?? dates[0]).day;
  return (
    <section aria-label="Whole week">
      <p className="label">The complete schedule</p>
      <h3 className="mt-1 text-[22px] leading-tight text-display sm:text-[26px]">Your week, step by step.</h3>
      <div className="mt-4 space-y-3">
        {daily.map(({ slot, list }) => list.length > 0 && (
          <Block key={slot} title={`Every ${slot === 'am' ? 'morning' : 'night'}`} count={list.length} open>
            <Rows steps={list} categoryLabel={categoryLabel} onOpen={(s) => onOpen(today, s.slot)} showSlot={false} />
          </Block>
        ))}
        {DAYS.map((day) => {
          const extras = SLOTS.flatMap((slot) => stepsFor(steps, slot, day).filter((s) => !isDaily(s)));
          const total = SLOTS.reduce((n, slot) => n + stepsFor(steps, slot, day).length, 0);
          const date = dates.find((d) => d.day === day);
          return (
            <Block key={day} title={DAY_LABEL[day]} sub={date ? `${date.date.getDate()}${date.isToday ? ' · today' : ''}` : undefined} count={total} open={date?.isToday}>
              {extras.length ? (
                <Rows steps={extras} categoryLabel={categoryLabel} onOpen={(s) => onOpen(day, s.slot)} showSlot />
              ) : (
                <p className="px-4 pb-4 text-[13px] text-secondary">{total ? 'Only the every-day steps.' : 'Rest day — nothing scheduled.'}</p>
              )}
            </Block>
          );
        })}
      </div>
    </section>
  );
}

function Block({ title, sub, count, open, children }: { title: string; sub?: string; count: number; open?: boolean; children: ReactNode }) {
  return (
    <details className="sched-overview card" open={open || undefined}>
      <summary>
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate">{title}</span>
          {sub && <span className="mono text-[12px] font-bold text-secondary">{sub}</span>}
        </span>
        <span className="flex items-center gap-2">
          <span className="label mono">{count} step{count === 1 ? '' : 's'}</span>
          <ChevronDown size={16} className="sched-chev" aria-hidden />
        </span>
      </summary>
      {children}
    </details>
  );
}

function Rows({ steps, categoryLabel, onOpen, showSlot }: { steps: Step[]; categoryLabel: (id: string) => string; onOpen: (s: Step) => void; showSlot: boolean }) {
  return (
    <ol className="divide-y divide-line border-t border-line">
      {steps.map((s, i) => {
        const Icon = SLOT_ICON[s.slot];
        return (
          <li key={s.id}>
            <button type="button" onClick={() => onOpen(s)} className="press flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-raised/60">
              <span className="mono w-5 shrink-0 text-[11px] font-bold text-muted">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-display">{s.title}</span>
                <span className="block truncate text-[12px] text-secondary">
                  {s.product ? `${s.product.brand ? `${s.product.brand} · ` : ''}${s.product.title}` : s.category ? categoryLabel(s.category) : 'No product pinned'}
                </span>
              </span>
              {showSlot && <Icon size={14} className="shrink-0 text-accent" aria-label={s.slot === 'am' ? 'Morning' : 'Night'} />}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
