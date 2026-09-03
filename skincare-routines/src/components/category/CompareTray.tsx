import { useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Sheet } from '../ui/Sheet';
import { Skeleton } from '../ui/primitives';
import { useDetail } from '../../data/hooks';
import type { ProductRow, ScoreKey } from '../../lib/types';
import { rupees, storeLabel } from '../../lib/format';
import { SCORE_META } from '../../domain/scoreMeta';

interface Props { category: string; shards: number; rows: ProductRow[]; ranks: number[]; onRemove: (id: string) => void; onClear: () => void }

/** Sticky bottom tray of up to 4 picks + a side-by-side sheet. Never renders the whole list as a table. */
export function CompareTray({ category, shards, rows, ranks, onRemove, onClear }: Props) {
  const [open, setOpen] = useState(false);
  if (!rows.length) return null;
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-black/90 backdrop-blur" role="region" aria-label="Compare tray">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6">
          <span className="label hidden sm:inline">Compare</span>
          <ul className="scrollbar-thin flex flex-1 gap-2 overflow-x-auto">
            {rows.map((r) => (
              <li key={r.id} className="flex shrink-0 items-center gap-2 rounded border border-line-strong bg-surface py-1 pl-1 pr-2">
                <img src={r.img} alt="" className="h-8 w-7 rounded-sm bg-white object-contain" />
                <span className="max-w-[140px] truncate text-[12px] text-primary">{r.b} {r.m}</span>
                <button type="button" onClick={() => onRemove(r.id)} className="p-0.5 text-muted hover:text-primary" aria-label={`Remove ${r.b} from compare`}><X size={12} /></button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setOpen(true)} className="btn btn-primary h-10" disabled={rows.length < 2}>Compare {rows.length}</button>
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
                    <img src={r.img} alt="" className="mb-2 h-20 w-16 rounded bg-white object-contain" />
                    <p className="label !text-primary">#{ranks[i]} · {r.b}</p>
                    <p className="mt-0.5 line-clamp-2 text-display">{r.m}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line border-y border-line">
              <Row label="Score">{rows.map((r) => <td key={r.id} className="py-2 pr-3"><span className="display text-[26px]">{r.s.toFixed(1)}</span></td>)}</Row>
              {SCORE_META.map((m) => <Row key={m.key} label={m.label}>{rows.map((r) => <Cell key={r.id} best={isBest(rows, m.key, r)}>{r.sc[m.key].toFixed(1)} / 10</Cell>)}</Row>)}
              <Row label="Price">{rows.map((r) => <td key={r.id} className="mono py-2 pr-3 text-primary">{rupees(r.p)}</td>)}</Row>
              <Row label="Rating">{rows.map((r) => <td key={r.id} className="mono py-2 pr-3 text-primary">{r.r !== null ? `${r.r}★${r.rc !== null ? ` (${r.rc.toLocaleString('en-IN')})` : ''}` : 'Not stated'}</td>)}</Row>
              <Row label="Size">{rows.map((r) => <td key={r.id} className="py-2 pr-3 text-primary">{r.q}</td>)}</Row>
              <Row label="Format">{rows.map((r) => <td key={r.id} className="py-2 pr-3 text-primary">{r.f}</td>)}</Row>
              <Row label="Store">{rows.map((r) => <td key={r.id} className="py-2 pr-3 text-primary">{storeLabel(r.st)}</td>)}</Row>
              <DetailRows category={category} shards={shards} rows={rows} />
            </tbody>
          </table>
        </div>
      </Sheet>
    </>
  );
}

const isBest = (rows: ProductRow[], k: ScoreKey, r: ProductRow) => rows.length > 1 && r.sc[k] === Math.max(...rows.map((x) => x.sc[k]));
function Row({ label, children }: { label: string; children: React.ReactNode }) { return <tr><th scope="row" className="label py-2 pr-3 text-left font-normal">{label}</th>{children}</tr>; }
function Cell({ best, children }: { best: boolean; children: React.ReactNode }) { return <td className={clsx('mono py-2 pr-3', best ? 'text-success' : 'text-primary')}>{children}</td>; }

/** Lazily loads the detail shard for each compared product; the hook count is fixed by slot (max 4). */
function DetailRows({ category, shards, rows }: { category: string; shards: number; rows: ProductRow[] }) {
  const d0 = useDetail(category, rows[0]?.id ?? null, shards);
  const d1 = useDetail(category, rows[1]?.id ?? null, shards);
  const d2 = useDetail(category, rows[2]?.id ?? null, shards);
  const d3 = useDetail(category, rows[3]?.id ?? null, shards);
  const details = [d0, d1, d2, d3].slice(0, rows.length);
  const keys = new Set<string>();
  for (const d of details) if (d.status === 'ready') for (const k of Object.keys(d.data.fullSpec)) keys.add(k);
  return (
    <>
      {[...keys].map((k) => (
        <Row key={k} label={k}>
          {details.map((d, i) => (
            <td key={rows[i].id} className="py-2 pr-3">
              {d.status === 'ready' ? <span className={d.data.fullSpec[k] === 'Not stated in listing' || !d.data.fullSpec[k] ? 'text-muted' : 'text-primary'}>{d.data.fullSpec[k] ?? 'Not stated in listing'}</span> : <Skeleton className="h-4 w-24" />}
            </td>
          ))}
        </Row>
      ))}
      <Row label="Listing">
        {details.map((d, i) => (
          <td key={rows[i].id} className="py-2 pr-3">
            {d.status === 'ready' ? <a href={d.data.buyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline">Open <ExternalLink size={12} /></a> : <Skeleton className="h-4 w-12" />}
          </td>
        ))}
      </Row>
    </>
  );
}
