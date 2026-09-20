import { ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';
import { ProductSnippet } from './ProductSnippet';
import { daysSummary, editVerb, SLOT_LABEL, ZONE_LABEL, type Proposal, type StepEdit, type StepVariant } from '../../schedule/model';
import { cycleIndex, cycleOf, weekMonday } from '../../schedule/rotation';

interface Props { edit: StepEdit; after: Proposal['step']; categoryLabel: (id: string) => string; positionNow?: number | null }

/** "Azelaic → Retinol → Glycolic" for a cycle, or a plain "Not rotating" for a step with one option. */
const cycleText = (step: Proposal['step']) => (step.rotation ? cycleOf(step).map((v) => v.title).join(' → ') : 'Not rotating');
const activeIndex = (step: Proposal['step'], monday: string) => (step.rotation ? cycleIndex(step.rotation, monday, cycleOf(step).length) : 0);

/** Before → after for an assistant edit to an existing step: only the fields that change are listed, the product as a card. */
export function EditDiff({ edit, after, categoryLabel, positionNow = null }: Props) {
  const b = edit.before;
  const rows: { label: string; from: string; to: string }[] = [];
  const isRotation = edit.op === 'rotate' || edit.op === 'stop_rotation';
  const monday = weekMonday(new Date());
  if (edit.op === 'owned' && edit.owned) {
    rows.push({ label: 'Shelf', from: edit.owned.have ? 'Not with me' : 'With me', to: edit.owned.have ? 'With me' : 'Not with me' });
  }
  if (isRotation) {
    rows.push({ label: 'Rotation', from: cycleText(b), to: cycleText(after) });
    const fromNow = cycleOf(b)[activeIndex(b, monday)]?.title ?? b.title;
    const toNow = cycleOf(after)[activeIndex(after, monday)]?.title ?? after.title;
    if (fromNow !== toNow) rows.push({ label: 'This week', from: fromNow, to: toNow });
  }
  if (edit.op !== 'remove' && edit.op !== 'owned') {
    if (b.title !== after.title) rows.push({ label: 'Step', from: b.title, to: after.title });
    if (b.slot !== after.slot) rows.push({ label: 'Slot', from: SLOT_LABEL[b.slot], to: SLOT_LABEL[after.slot] });
    if (b.days.join() !== after.days.join()) rows.push({ label: 'Days', from: daysSummary(b.days), to: daysSummary(after.days) });
    if (b.zone !== after.zone) rows.push({ label: 'Zone', from: ZONE_LABEL[b.zone], to: ZONE_LABEL[after.zone] });
    if (b.category !== after.category) rows.push({ label: 'Category', from: b.category ? categoryLabel(b.category) : '—', to: after.category ? categoryLabel(after.category) : '—' });
    if (b.note !== after.note) rows.push({ label: 'Note', from: b.note || '—', to: after.note || '—' });
    if (edit.position) rows.push({ label: 'Order', from: `#${positionNow ?? edit.position.from} in ${SLOT_LABEL[b.slot]}`, to: `#${edit.position.to} in ${SLOT_LABEL[after.slot]}` });
  }
  const productChanged = edit.op !== 'remove' && edit.op !== 'owned' && (b.product?.id ?? null) !== (after.product?.id ?? null);
  const cycleAfter: StepVariant[] = edit.op === 'rotate' ? cycleOf(after) : [];
  const onNow = edit.op === 'rotate' ? activeIndex(after, monday) : -1;
  return (
    <div className="mt-3 rounded-[12px] border border-line bg-surface p-3">
      <p className="label text-accent">{editVerb(edit)} · {b.title}</p>
      {edit.op === 'owned' && b.product && (
        <div className="mt-2">
          <ProductSnippet product={b.product} categoryLabel={categoryLabel} />
          <p className="mt-1.5 text-[12.5px] text-secondary">
            {edit.owned?.have ? 'Marks this listing as with you again — its steps stop showing greyed on the days.' : 'A shelf note only: the step stays in your routine and shows greyed on the days until you mark it with you again.'}
          </p>
        </div>
      )}
      {edit.op === 'remove' && (
        <p className="mt-1 text-[13px] text-secondary">
          Removes this {SLOT_LABEL[b.slot]} step ({daysSummary(b.days)}{b.product ? ` · ${b.product.brand} ${b.product.title}` : ''}) from your routine.
        </p>
      )}
      {rows.length > 0 && (
        <dl className="mt-2 grid gap-1.5 text-[13px]">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[64px_minmax(0,1fr)] items-baseline gap-2">
              <dt className="label">{r.label}</dt>
              <dd className="flex min-w-0 flex-wrap items-center gap-1.5">
                <s className="min-w-0 break-words text-muted">{r.from}</s>
                <ArrowRight size={12} className="shrink-0 text-muted" aria-hidden />
                <span className="min-w-0 break-words font-semibold text-primary">{r.to}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
      {cycleAfter.length > 1 && (
        <ol className="mt-2 grid gap-1.5" aria-label="Weekly cycle after the change">
          {cycleAfter.map((v, i) => (
            <li key={i} className={clsx('rounded-[10px] border px-2.5 py-1.5', i === onNow ? 'border-accent/50 bg-accent-soft/50' : 'border-line')}>
              <p className="flex flex-wrap items-baseline gap-x-2 text-[12.5px]">
                <span className="label">Week {i + 1}</span>
                <span className="font-semibold text-primary">{v.title}</span>
                {i === onNow && <span className="label text-accent">this week</span>}
              </p>
              {v.product ? <p className="text-[12.5px] text-secondary">{v.product.brand} {v.product.title}{v.product.rank != null ? ` · #${v.product.rank}` : ''}</p> : <p className="text-[12.5px] text-secondary">No listing pinned.</p>}
            </li>
          ))}
        </ol>
      )}
      {productChanged && !cycleAfter.length && (
        <div className="mt-2 grid gap-2">
          <div className="opacity-60">
            <p className="label mb-1">Now</p>
            {b.product ? <ProductSnippet product={b.product} categoryLabel={categoryLabel} /> : <p className="text-[12.5px] text-secondary">No listing pinned.</p>}
          </div>
          <div>
            <p className="label mb-1 text-accent">After</p>
            {after.product ? <ProductSnippet product={after.product} categoryLabel={categoryLabel} /> : <p className="text-[12.5px] text-secondary">No listing pinned.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
