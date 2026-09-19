import { ArrowRight } from 'lucide-react';
import { ProductSnippet } from './ProductSnippet';
import { daysSummary, EDIT_VERB, SLOT_LABEL, ZONE_LABEL, type Proposal, type StepEdit } from '../../schedule/model';

interface Props { edit: StepEdit; after: Proposal['step']; categoryLabel: (id: string) => string; positionNow?: number | null }

/** Before → after for an assistant edit to an existing step: only the fields that change are listed, the product as a card. */
export function EditDiff({ edit, after, categoryLabel, positionNow = null }: Props) {
  const b = edit.before;
  const rows: { label: string; from: string; to: string }[] = [];
  if (edit.op !== 'remove') {
    if (b.title !== after.title) rows.push({ label: 'Step', from: b.title, to: after.title });
    if (b.slot !== after.slot) rows.push({ label: 'Slot', from: SLOT_LABEL[b.slot], to: SLOT_LABEL[after.slot] });
    if (b.days.join() !== after.days.join()) rows.push({ label: 'Days', from: daysSummary(b.days), to: daysSummary(after.days) });
    if (b.zone !== after.zone) rows.push({ label: 'Zone', from: ZONE_LABEL[b.zone], to: ZONE_LABEL[after.zone] });
    if (b.category !== after.category) rows.push({ label: 'Category', from: b.category ? categoryLabel(b.category) : '—', to: after.category ? categoryLabel(after.category) : '—' });
    if (b.note !== after.note) rows.push({ label: 'Note', from: b.note || '—', to: after.note || '—' });
    if (edit.position) rows.push({ label: 'Order', from: `#${positionNow ?? edit.position.from} in ${SLOT_LABEL[b.slot]}`, to: `#${edit.position.to} in ${SLOT_LABEL[after.slot]}` });
  }
  const productChanged = edit.op !== 'remove' && (b.product?.id ?? null) !== (after.product?.id ?? null);
  return (
    <div className="mt-3 rounded-[12px] border border-line bg-surface p-3">
      <p className="label text-accent">{EDIT_VERB[edit.op]} · {b.title}</p>
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
      {productChanged && (
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
