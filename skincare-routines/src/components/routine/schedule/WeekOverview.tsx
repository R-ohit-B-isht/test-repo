import type { ReactNode } from 'react';
import { ChevronDown, Moon, PackageOpen, Pencil, Repeat, Sun } from 'lucide-react';
import { clsx } from 'clsx';
import { DAY_LABEL, DAYS, SLOTS, stepsFor, type Day, type Slot, type Step } from '../../../schedule/model';
import { useMissing } from '../../../schedule/ownedStore';
import { viewForWeek, weekMonday } from '../../../schedule/rotation';
import type { WeekDate } from '../../../schedule/week';

interface Props { steps: Step[]; dates: WeekDate[]; categoryLabel: (id: string) => string; onOpen: (day: Day, slot: Slot) => void; onEdit: (step: Step) => void }
interface RowsProps { steps: Step[]; monday: string; missing: ReadonlySet<string>; categoryLabel: (id: string) => string; onOpen: (s: Step) => void; onEdit: (s: Step) => void; showSlot: boolean }

const SLOT_ICON = { am: Sun, pm: Moon } as const;
const isDaily = (s: Step) => s.days.length === 7;

/** "Your week, step by step": the every-day blocks once, then each day's extras — all read live from the saved steps in
 * stored order (reference site's expandable overview). Tapping a row opens that day and slot in the daily view. */
export function WeekOverview({ steps, dates, categoryLabel, onOpen, onEdit }: Props) {
  const daily = SLOTS.map((slot) => ({ slot, list: stepsFor(steps, slot, null).filter(isDaily) }));
  const todayDate = dates.find((d) => d.isToday) ?? dates[0];
  const today = todayDate.day;
  const monday = weekMonday(todayDate.date);
  const missing = useMissing();
  const rows = { monday, missing, categoryLabel, onEdit };
  return (
    <section aria-label="Whole week">
      <p className="label">The complete schedule</p>
      <h3 className="mt-1 text-[22px] leading-tight text-display sm:text-[26px]">Your week, step by step.</h3>
      <div className="mt-4 space-y-3">
        {daily.map(({ slot, list }) => list.length > 0 && (
          <Block key={slot} title={`Every ${slot === 'am' ? 'morning' : 'night'}`} count={list.length} open>
            <Rows steps={list} {...rows} onOpen={(s) => onOpen(today, s.slot)} showSlot={false} />
          </Block>
        ))}
        {DAYS.map((day) => {
          const extras = SLOTS.flatMap((slot) => stepsFor(steps, slot, day).filter((s) => !isDaily(s)));
          const total = SLOTS.reduce((n, slot) => n + stepsFor(steps, slot, day).length, 0);
          const date = dates.find((d) => d.day === day);
          return (
            <Block key={day} title={DAY_LABEL[day]} sub={date ? `${date.date.getDate()}${date.isToday ? ' · today' : ''}` : undefined} count={total} open={date?.isToday}>
              {extras.length ? (
                <Rows steps={extras} {...rows} onOpen={(s) => onOpen(day, s.slot)} showSlot />
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

/** One row per step for the week on view: a rotating step shows this week's variant plus what's next; a product marked
 * "not with me" on the shelf fades the row and says so in words. */
function Rows({ steps, monday, missing, categoryLabel, onOpen, onEdit, showSlot }: RowsProps) {
  return (
    <ol className="divide-y divide-line border-t border-line">
      {steps.map((s, i) => {
        const Icon = SLOT_ICON[s.slot];
        const { now, rotation } = viewForWeek(s, monday);
        const notWithMe = now.product !== null && missing.has(now.product.id);
        return (
          <li key={s.id} className={clsx('flex items-stretch', notWithMe && 'sched-row-missing')}>
            <button type="button" onClick={() => onOpen(s)} className="press flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-2 text-left hover:bg-raised/60">
              <span className="mono w-5 shrink-0 text-[11px] font-bold text-muted">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[14px] font-bold text-display">
                  <span className="truncate">{now.title}</span>
                  {notWithMe && <span className="sched-missing-tag shrink-0"><PackageOpen size={11} aria-hidden />Not with me</span>}
                </span>
                <span className="block truncate text-[12px] text-secondary">
                  {now.product ? `${now.product.brand ? `${now.product.brand} · ` : ''}${now.product.title}` : now.category ? categoryLabel(now.category) : 'No product pinned'}
                </span>
                {rotation && (
                  <span className="mt-1 flex items-center gap-2 text-[11.5px] text-secondary">
                    <span className="rota-chip"><Repeat size={10} aria-hidden />wk {rotation.index + 1}/{rotation.total}</span>
                    <span className="truncate">next: {rotation.next.title}</span>
                  </span>
                )}
              </span>
              {showSlot && <Icon size={14} className="shrink-0 text-accent" aria-label={s.slot === 'am' ? 'Morning' : 'Night'} />}
            </button>
            <button type="button" onClick={() => onEdit(s)} aria-label={`Edit ${now.title}: swap, rotate weekly, move or remove`} title="Edit step"
              className="press flex w-11 shrink-0 items-center justify-center text-secondary hover:bg-raised/60 hover:text-display">
              <Pencil size={14} aria-hidden />
            </button>
          </li>
        );
      })}
    </ol>
  );
}
