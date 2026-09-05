import { ExternalLink, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Sheet } from '../ui/Sheet';
import { EvidenceBadge, ScoreBadge, Skeleton } from '../ui/primitives';
import { useDetail } from '../../data/hooks';
import type { EvidenceField, FieldDef, ProductRow, ScoreKey } from '../../lib/types';
import { rupees, storeLabel } from '../../lib/format';
import { MAKER_SHORT, SCORE_META, TIER_META, TONE_TEXT } from '../../domain/scoreMeta';

interface Props {
  category: string; shards: number; fields: FieldDef[]; rows: ProductRow[]; ranks: number[]; onRemove: (id: string) => void; onClear: () => void;
  open: boolean; onOpenChange: (open: boolean) => void;
}

/** Sticky bottom tray of up to 4 picks + a side-by-side sheet (controlled, so a toast action can open it). Never renders the whole list as a table. */
export function CompareTray({ category, shards, fields, rows, ranks, onRemove, onClear, open, onOpenChange }: Props) {
  const scoreMeta = SCORE_META;
  const setOpen = onOpenChange;
  if (!rows.length) return null;
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-5" role="region" aria-label="Compare tray">
        <div className="card mx-auto flex max-w-[1100px] items-center gap-3 px-3 py-2.5 shadow-[0_12px_40px_-12px_rgba(26,23,29,0.35)] sm:px-4">
          <span className="label hidden sm:inline">Compare</span>
          <ul className="scrollbar-thin flex flex-1 gap-2 overflow-x-auto">
            {rows.map((r) => (
              <li key={r.id} className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-raised py-1 pl-1 pr-2">
                <img src={r.img} alt="" className="h-8 w-8 rounded-full bg-white object-contain" />
                <span className="max-w-[140px] truncate text-[12px] font-bold text-display">{r.b} {r.m}</span>
                <button type="button" onClick={() => onRemove(r.id)} className="rounded-full p-0.5 text-muted hover:bg-surface hover:text-primary" aria-label={`Remove ${r.b} from compare`}><X size={12} /></button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setOpen(true)} className="btn btn-accent h-10" disabled={rows.length < 2}>Compare {rows.length}</button>
          <button type="button" onClick={onClear} className="btn h-10 px-3" aria-label="Clear compare">Clear</button>
        </div>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title={`Comparing ${rows.length} products`} wide>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="label w-[160px] py-2 pr-3 text-left align-bottom">Field</th>
                {rows.map((r, i) => (
                  <th key={r.id} className="py-2 pr-3 text-left align-bottom">
                    <div className="mb-3 flex h-24 w-20 items-center justify-center rounded-xl bg-white p-1"><img src={r.img} alt="" className="h-full w-full object-contain" /></div>
                    <p className="text-[12px] font-bold text-accent">#{ranks[i]} · {r.b}</p>
                    <p className="mt-0.5 line-clamp-2 text-[14px] text-display">{r.m}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-y border-line">
              <Row label="Score">{rows.map((r) => <td key={r.id} className="py-3 pr-3"><ScoreBadge score={r.s} showVerdict={false} /></td>)}</Row>
              {scoreMeta.map((m) => <Row key={m.key} label={m.label}>{rows.map((r) => <Cell key={r.id} best={isBest(rows, m.key, r)}>{r.sc[m.key].toFixed(1)} / 10</Cell>)}</Row>)}
              <Row label="Price">{rows.map((r) => <td key={r.id} className="mono py-2 pr-3 font-bold text-display">{rupees(r.p)}</td>)}</Row>
              <Row label="Rating">{rows.map((r) => <td key={r.id} className="mono py-2 pr-3 text-primary">{r.r !== null ? `${r.r}★${r.rc !== null ? ` (${r.rc.toLocaleString('en-IN')})` : ''}` : 'Not stated'}</td>)}</Row>
              <Row label="Evidence">{rows.map((r) => <td key={r.id} className="py-2 pr-3"><EvidenceBadge status={r.ev} verified={r.vf} /></td>)}</Row>
              <Row label="Maker">{rows.map((r) => <td key={r.id} className="py-2 pr-3 text-primary">{MAKER_SHORT[r.mk]}</td>)}</Row>
              <Row label="Store">{rows.map((r) => <td key={r.id} className="py-2 pr-3 text-primary">{storeLabel(r.st)}</td>)}</Row>
              <DetailRows category={category} shards={shards} fields={fields} rows={rows} />
            </tbody>
          </table>
        </div>
      </Sheet>
    </>
  );
}

const isBest = (rows: ProductRow[], k: ScoreKey, r: ProductRow) => rows.length > 1 && r.sc[k] === Math.max(...rows.map((x) => x.sc[k]));
function Row({ label, children }: { label: string; children: React.ReactNode }) { return <tr><th scope="row" className="label py-2 pr-3 text-left">{label}</th>{children}</tr>; }
function Cell({ best, children }: { best: boolean; children: React.ReactNode }) { return <td className={clsx('mono py-2 pr-3', best ? 'font-extrabold text-success' : 'text-primary')}>{children}</td>; }

/** One verified field in a compare cell: value + where it was read (maker page / spec table / claim / rejected / not stated). */
function FieldCell({ f }: { f: EvidenceField | undefined }) {
  if (!f) return <span className="text-muted">Not stated</span>;
  const scored = f.tier === 'official' || f.tier === 'listing';
  return (
    <span className="flex flex-col">
      <span className={scored ? 'font-semibold text-display' : 'text-muted'}>{f.display ?? 'Not stated'}</span>
      <span className={clsx('label', TONE_TEXT[TIER_META[f.tier].tone])}>{TIER_META[f.tier].short}</span>
    </span>
  );
}

/** Lazily loads the detail shard for each compared product; the hook count is fixed by slot (max 4). Rows follow the category's field schema so every product shows the same fields, stated or not. */
function DetailRows({ category, shards, fields, rows }: { category: string; shards: number; fields: FieldDef[]; rows: ProductRow[] }) {
  const d0 = useDetail(category, rows[0]?.id ?? null, shards);
  const d1 = useDetail(category, rows[1]?.id ?? null, shards);
  const d2 = useDetail(category, rows[2]?.id ?? null, shards);
  const d3 = useDetail(category, rows[3]?.id ?? null, shards);
  const details = [d0, d1, d2, d3].slice(0, rows.length);
  return (
    <>
      {fields.map((fd) => (
        <Row key={fd.key} label={fd.label}>
          {details.map((d, i) => (
            <td key={rows[i].id} className="py-2 pr-3 align-top">
              {d.status === 'ready' ? <FieldCell f={d.data.evidence.fields.find((f) => f.key === fd.key)} /> : <Skeleton className="h-4 w-24" />}
            </td>
          ))}
        </Row>
      ))}
      <Row label="Warranty">
        {details.map((d, i) => (
          <td key={rows[i].id} className="py-2 pr-3 text-primary">{d.status === 'ready' ? d.data.evidence.maker.warranty : <Skeleton className="h-4 w-24" />}</td>
        ))}
      </Row>
      <Row label="Listing">
        {details.map((d, i) => (
          <td key={rows[i].id} className="py-2 pr-3">
            {d.status === 'ready' ? <a href={d.data.buyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-accent underline-offset-2 hover:underline">Open <ExternalLink size={12} /></a> : <Skeleton className="h-4 w-12" />}
          </td>
        ))}
      </Row>
    </>
  );
}
