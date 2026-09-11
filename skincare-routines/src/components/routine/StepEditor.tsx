import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Sheet } from '../ui/Sheet';
import { ProductSnippet } from './ProductSnippet';
import type { CategoryMeta } from '../../lib/types';
import { zoneMatches, type StepDraft } from '../../schedule/draft';
import { DAYS, DAY_LABEL, PLAN_ZONES, SLOTS, SLOT_LABEL, ZONE_LABEL, type Day } from '../../schedule/model';

interface Props {
  open: boolean;
  title: string;
  submitLabel: string;
  initial: StepDraft;
  categories: CategoryMeta[];
  categoryLabel: (id: string) => string;
  onClose: () => void;
  onSubmit: (draft: StepDraft) => void;
}

const WEEKDAYS: Day[] = ['mon', 'tue', 'wed', 'thu', 'fri'];
const PRESETS: { label: string; days: Day[] }[] = [
  { label: 'Every day', days: [...DAYS] },
  { label: 'Weekdays', days: WEEKDAYS },
  { label: 'Alternate', days: ['mon', 'wed', 'fri', 'sun'] },
  { label: 'Twice a week', days: ['tue', 'sat'] },
];

/** One form for adding a step, editing one, or editing an assistant proposal before accepting it. The pinned product can only be
 *  kept or removed here — a listing is never typed in by hand, so every product on the plan is one the site actually ranks. */
export function StepEditor({ open, title, submitLabel, initial, categories, categoryLabel, onClose, onSubmit }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={title} narrow
      footer={
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="btn">Cancel</button>
          <button type="submit" form={FORM_ID} className="btn btn-primary">{submitLabel}</button>
        </div>
      }>
      {open && <StepForm initial={initial} categories={categories} categoryLabel={categoryLabel} onSubmit={onSubmit} />}
    </Sheet>
  );
}

const FORM_ID = 'step-form';

/** Mounted only while the sheet is open, so each opening starts from its own `initial` without effects. */
function StepForm({ initial, categories, categoryLabel, onSubmit }: Pick<Props, 'initial' | 'categories' | 'categoryLabel' | 'onSubmit'>) {
  const [draft, setDraft] = useState<StepDraft>(initial);
  const [touched, setTouched] = useState(false);
  const patch = (p: Partial<StepDraft>) => setDraft((d) => ({ ...d, ...p }));
  const toggleDay = (day: Day) => patch({ days: draft.days.includes(day) ? draft.days.filter((d) => d !== day) : DAYS.filter((d) => d === day || draft.days.includes(d)) });
  const sameDays = (days: Day[]) => days.length === draft.days.length && days.every((d) => draft.days.includes(d));
  const titleError = touched && !draft.title.trim() ? 'Give the step a name.' : null;
  const daysError = touched && draft.days.length === 0 ? 'Pick at least one day.' : null;
  const submit = () => {
    setTouched(true);
    if (!draft.title.trim() || draft.days.length === 0) return;
    onSubmit({ ...draft, title: draft.title.trim(), note: draft.note.trim() });
  };
  const options = categories.filter((c) => zoneMatches(c, draft.zone));
  return (
    <form id={FORM_ID} className="space-y-6" onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
        <Field label="Step" error={titleError}>
          <input id="step-title" className="field w-full" value={draft.title} placeholder="e.g. Gentle cleanser" maxLength={80}
            onChange={(e) => patch({ title: e.target.value })} aria-invalid={!!titleError} />
        </Field>
        <Field label="When">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Slot">
            {SLOTS.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={draft.slot === s} className="chip justify-center" aria-pressed={draft.slot === s} onClick={() => patch({ slot: s })}>{SLOT_LABEL[s]}</button>
            ))}
          </div>
        </Field>
        <Field label="Days" error={daysError} hint={draft.days.length === 7 ? 'Every day' : `${draft.days.length} of 7 days`}>
          <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Days of the week">
            {DAYS.map((d) => {
              const on = draft.days.includes(d);
              return (
                <button key={d} type="button" aria-pressed={on} onClick={() => toggleDay(d)}
                  className={clsx('press flex h-11 flex-col items-center justify-center rounded-[10px] border text-[12px] font-bold transition-colors',
                    on ? 'border-primary bg-primary text-page' : 'border-line-strong bg-surface text-secondary hover:border-secondary')}>
                  {DAY_LABEL[d]}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.label} type="button" className="chip h-8 px-3 text-[12px]" aria-pressed={sameDays(p.days)} onClick={() => patch({ days: p.days })}>{p.label}</button>
            ))}
          </div>
        </Field>
        <Field label="Where">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Zone">
            {PLAN_ZONES.map((z) => (
              <button key={z} type="button" role="radio" aria-checked={draft.zone === z} aria-pressed={draft.zone === z} className="chip h-9"
                onClick={() => patch({ zone: z, category: draft.category && categories.some((c) => c.id === draft.category && zoneMatches(c, z)) ? draft.category : null })}>
                {ZONE_LABEL[z]}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Product category" hint="Optional — links the step to a ranked page on this site.">
          <select id="step-category" className="field w-full" value={draft.category ?? ''} onChange={(e) => patch({ category: e.target.value || null, product: draft.product && draft.product.category === e.target.value ? draft.product : null })}>
            <option value="">None</option>
            {options.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        {draft.product && (
          <Field label="Pinned listing" hint="Copied from the site's ranking; remove it if you want the step without a specific product.">
            <ProductSnippet product={draft.product} categoryLabel={categoryLabel} />
            <button type="button" className="btn mt-2 h-9" onClick={() => patch({ product: null })}>Remove listing</button>
          </Field>
        )}
        <Field label="Note" hint="How to use it, what to watch for.">
          <textarea id="step-note" className="field min-h-[88px] w-full resize-y py-2.5 leading-relaxed" value={draft.note} maxLength={400}
            onChange={(e) => patch({ note: e.target.value })} placeholder="e.g. Pea-sized amount, wait 20 min before moisturiser" />
        </Field>
      </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <div>
      <p className="label mb-2">{label}</p>
      {children}
      {error ? <p className="mt-1.5 text-[12px] font-semibold text-danger" role="alert">{error}</p> : hint ? <p className="mt-1.5 text-[12px] text-muted">{hint}</p> : null}
    </div>
  );
}
