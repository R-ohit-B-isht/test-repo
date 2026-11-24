import { useMemo, useState, useDeferredValue } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, ExternalLink, Plus, Check, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { clsx } from 'clsx';
import { DIM_LABEL, GROUPS, rupees, useDetail, useLoad, type Dim, type Manifest, type Row, type RowsFile } from '../data';
import { Bar, Chip, Score } from '../components/bits';

type Sort = 'score' | 'tier' | 'tech' | 'materials' | 'buyers' | 'name';
const SORTS: [Sort, string][] = [['score', 'Quality score'], ['tier', 'Maker tier'], ['tech', 'Technology'], ['materials', 'Materials'], ['buyers', 'Buyer rating'], ['name', 'Name A–Z']];

export default function Browse() {
  const m = useLoad<Manifest>('manifest.json');
  const rf = useLoad<RowsFile>('rows.json');
  const [sp, setSp] = useSearchParams();
  const [open, setOpen] = useState<string | null>(null);
  const [cmp, setCmp] = useState<string[]>([]);
  const [cmpOpen, setCmpOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const qText = sp.get('q') ?? '';
  const dq = useDeferredValue(qText.toLowerCase().trim());
  const sort = (sp.get('sort') as Sort) ?? 'score';

  const groupOf = useMemo(() => rf?.tagIndex.map(([g]) => g) ?? [], [rf]);
  const selected = useMemo(() => {
    const out: Record<string, Set<number>> = {};
    if (!rf) return out;
    for (const g of GROUPS) {
      const vals = sp.getAll(g.id);
      if (vals.length) out[g.id] = new Set(rf.tagIndex.flatMap(([gg, l], i) => (gg === g.id && vals.includes(l) ? [i] : [])));
    }
    return out;
  }, [rf, sp]);

  const match = (r: Row, skip?: string) => {
    for (const [g, set] of Object.entries(selected)) if (g !== skip && !r.t.some((t) => set.has(t))) return false;
    if (dq && !(`${r.b} ${r.n} ${r.u}`.toLowerCase().includes(dq))) return false;
    return true;
  };
  const list = useMemo(() => {
    if (!rf) return [];
    const xs = rf.rows.filter((r) => match(r));
    const key = (r: Row) => (sort === 'score' ? r.s : sort === 'name' ? 0 : r.sc[sort as Dim] + r.s / 1000);
    return sort === 'name' ? xs.sort((a, b) => a.n.localeCompare(b.n)) : xs.sort((a, b) => key(b) - key(a));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rf, selected, dq, sort]);
  const counts = useMemo(() => {
    const c: Record<string, Record<number, number>> = {};
    if (!rf) return c;
    for (const g of GROUPS) {
      const cc: Record<number, number> = {};
      for (const r of rf.rows) if (match(r, g.id)) for (const t of r.t) if (groupOf[t] === g.id) cc[t] = (cc[t] ?? 0) + 1;
      c[g.id] = cc;
    }
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rf, selected, dq, groupOf]);

  const toggle = (g: string, label: string) => {
    const next = new URLSearchParams(sp);
    const vals = next.getAll(g);
    next.delete(g);
    (vals.includes(label) ? vals.filter((v) => v !== label) : [...vals, label]).forEach((v) => next.append(g, v));
    setSp(next, { replace: true });
  };
  const setParam = (k: string, v: string) => { const next = new URLSearchParams(sp); if (v) next.set(k, v); else next.delete(k); setSp(next, { replace: true }); };
  const active = GROUPS.flatMap((g) => sp.getAll(g.id).map((v) => [g.id, v] as const));
  const v = useWindowVirtualizer({ count: list.length, estimateSize: () => 132, overscan: 8 });
  const byId = useMemo(() => new Map(rf?.rows.map((r) => [r.id, r]) ?? []), [rf]);
  if (!m || !rf) return <p className="p-8 text-muted">Loading the catalogue…</p>;

  const filters = (
    <div className="space-y-1">
      {GROUPS.map((g) => <FacetGroup key={g.id} id={g.id} label={g.label} defaultOpen={!!g.open || !!selected[g.id]} tagIndex={rf.tagIndex} counts={counts[g.id] ?? {}} chosen={sp.getAll(g.id)} onToggle={(l) => toggle(g.id, l)} />)}
    </div>
  );
  return (
    <main className="mx-auto grid max-w-[1400px] gap-6 px-4 pb-32 pt-5 lg:grid-cols-[290px_minmax(0,1fr)]">
      <aside className="hidden lg:block"><div className="sticky top-[72px] max-h-[calc(100dvh-88px)] overflow-y-auto pr-2">{filters}</div></aside>
      <section className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-line bg-surface px-3">
            <Search size={16} className="text-muted" />
            <input value={qText} onChange={(e) => setParam('q', e.target.value)} placeholder="Search names, e.g. Pegasus, Ferrari, Samba" className="w-full bg-transparent text-[14px] outline-none" />
          </label>
          <select value={sort} onChange={(e) => setParam('sort', e.target.value === 'score' ? '' : e.target.value)} className="h-10 rounded-full border border-line bg-surface px-3 text-[14px] font-bold">
            {SORTS.map(([k, l]) => <option key={k} value={k}>Sort: {l}</option>)}
          </select>
          <button type="button" onClick={() => setFiltersOpen(true)} className="flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-3 text-[14px] font-bold lg:hidden"><SlidersHorizontal size={16} />Filters</button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-bold text-display">{list.length.toLocaleString('en-IN')} products</span>
          {active.map(([g, l]) => <Chip key={g + l} active onClick={() => toggle(g, l)}>{l}<X size={12} /></Chip>)}
          {active.length > 0 && <button type="button" className="text-[12px] font-bold text-accent" onClick={() => setSp(new URLSearchParams(qText ? { q: qText } : {}), { replace: true })}>Clear all</button>}
        </div>
        <div className="relative mt-4" style={{ height: v.getTotalSize() }}>
          {v.getVirtualItems().map((vi) => {
            const r = list[vi.index];
            return (
              <div key={r.id} data-index={vi.index} ref={v.measureElement} className="absolute left-0 right-0 pb-2" style={{ transform: `translateY(${vi.start - v.options.scrollMargin}px)` }}>
                <Card r={r} rank={vi.index + 1} rf={rf} m={m} compared={cmp.includes(r.id)} onOpen={() => setOpen(r.id)} onCompare={() => setCmp((c) => (c.includes(r.id) ? c.filter((x) => x !== r.id) : c.length < 4 ? [...c, r.id] : c))} />
              </div>
            );
          })}
        </div>
        {list.length === 0 && <p className="card mt-4 p-6 text-secondary">Nothing matches those filters. Remove a chip above.</p>}
      </section>
      {filtersOpen && <Drawer onClose={() => setFiltersOpen(false)} title={`Filters · ${list.length} results`}>{filters}</Drawer>}
      {open && <Drawer wide onClose={() => setOpen(null)} title="Product details"><Sheet r={byId.get(open)!} rank={list.findIndex((x) => x.id === open) + 1} rf={rf} m={m} /></Drawer>}
      {cmp.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3">
            {cmp.map((id) => <img key={id} src={byId.get(id)?.img} alt="" className="h-12 w-10 rounded bg-white object-contain ring-1 ring-line" />)}
            <span className="text-[13px] text-secondary">{cmp.length}/4 selected</span>
            <button type="button" onClick={() => setCmpOpen(true)} disabled={cmp.length < 2} className="ml-auto rounded-full bg-accent px-4 py-2 text-[14px] font-bold text-accent-ink disabled:opacity-40">Compare</button>
            <button type="button" onClick={() => setCmp([])} className="text-[13px] font-bold text-muted">Clear</button>
          </div>
        </div>
      )}
      {cmpOpen && <Drawer wide onClose={() => setCmpOpen(false)} title="Side-by-side"><Compare ids={cmp} byId={byId} rf={rf} m={m} /></Drawer>}
    </main>
  );
}

function FacetGroup({ id, label, defaultOpen, tagIndex, counts, chosen, onToggle }: { id: string; label: string; defaultOpen: boolean; tagIndex: [string, string][]; counts: Record<number, number>; chosen: string[]; onToggle: (l: string) => void }) {
  const [open, setOpen] = useState(defaultOpen);
  const [all, setAll] = useState(false);
  const [f, setF] = useState('');
  const opts = tagIndex.map(([g, l], i) => ({ g, l, n: counts[i] ?? 0 })).filter((o) => o.g === id && (o.n > 0 || chosen.includes(o.l)) && o.l.toLowerCase().includes(f.toLowerCase())).sort((a, b) => b.n - a.n);
  const shown = all ? opts : opts.slice(0, 10);
  return (
    <div className="border-b border-line py-2">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-1.5 text-[14px] font-extrabold text-display">{label}{chosen.length > 0 && <span className="ml-2 rounded-full bg-accent px-1.5 text-[11px] text-accent-ink">{chosen.length}</span>}<ChevronDown size={16} className={clsx('ml-auto transition', open && 'rotate-180')} /></button>
      {open && (
        <div className="pb-1">
          {opts.length > 12 && <input value={f} onChange={(e) => setF(e.target.value)} placeholder={`Find ${label.toLowerCase()}`} className="mb-1.5 h-8 w-full rounded-lg border border-line bg-surface px-2 text-[13px] outline-none" />}
          {shown.map((o) => (
            <label key={o.l} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-[13px] hover:bg-raised">
              <input type="checkbox" checked={chosen.includes(o.l)} onChange={() => onToggle(o.l)} className="accent-[var(--accent)]" />
              <span className="flex-1 truncate">{o.l}</span><span className="mono text-muted">{o.n}</span>
            </label>
          ))}
          {opts.length > 10 && <button type="button" onClick={() => setAll(!all)} className="mt-1 text-[12px] font-bold text-accent">{all ? 'Show fewer' : `Show all ${opts.length}`}</button>}
        </div>
      )}
    </div>
  );
}

const labelsOf = (r: Row, rf: RowsFile, g: string) => r.t.filter((t) => rf.tagIndex[t][0] === g).map((t) => rf.tagIndex[t][1]);
const catLabel = (r: Row, m: Manifest) => m.categories.find((c) => c.id === r.c)?.label ?? r.c;

function Card({ r, rank, rf, m, compared, onOpen, onCompare }: { r: Row; rank: number; rf: RowsFile; m: Manifest; compared: boolean; onOpen: () => void; onCompare: () => void }) {
  const chips = [...labelsOf(r, rf, 'sport'), ...labelsOf(r, rf, 'gender'), ...labelsOf(r, rf, 'team'), ...labelsOf(r, rf, 'tier').filter((x) => x !== 'No tier stated'), ...labelsOf(r, rf, 'tech').slice(0, 3)];
  return (
    <article className="card card-hover grid grid-cols-[28px_64px_minmax(0,1fr)] items-center gap-3 p-3 sm:grid-cols-[40px_80px_minmax(0,1fr)_auto_auto] sm:gap-4">
      <span className="mono text-center text-[15px] font-extrabold text-muted">{rank}</span>
      <button type="button" onClick={onOpen} className="press h-[84px] w-[64px] overflow-hidden rounded-lg bg-white ring-1 ring-line sm:h-[100px] sm:w-[80px]">{r.img && <img src={r.img} alt="" loading="lazy" className="h-full w-full object-contain" />}</button>
      <button type="button" onClick={onOpen} className="min-w-0 text-left">
        <span className="flex flex-wrap items-center gap-x-2 text-[12px] font-bold"><span className="text-accent">{r.b}</span><span className="text-secondary">{catLabel(r, m)}</span>{!r.k && <span className="text-[var(--danger)]">Out of stock</span>}{labelsOf(r, rf, 'evidence')[0] === 'Listing data only' && <span className="text-[var(--warning)]">Listing data only</span>}</span>
        <span className="mt-0.5 block line-clamp-1 text-[15px] font-bold text-display">{r.n}</span>
        {r.u && <span className="block line-clamp-1 text-[13px] text-secondary">{r.u}</span>}
        <span className="mt-1.5 flex flex-wrap gap-1">{chips.slice(0, 7).map((c) => <span key={c} className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-bold text-secondary">{c}</span>)}</span>
      </button>
      <div className="col-span-3 flex items-center gap-4 sm:col-span-1 sm:flex-col sm:items-end sm:gap-1">
        <Score s={r.s} />
        <span className="text-[12px] text-muted">{r.r != null ? <span className="inline-flex items-center gap-1"><Star size={11} />{r.r.toFixed(1)} ({r.rc})</span> : 'No ratings'}</span>
        <span className="text-[12px] text-muted">{rupees(r.p)}</span>
      </div>
      <button type="button" onClick={onCompare} aria-label="Compare" className={clsx('hidden h-9 w-9 items-center justify-center rounded-full border sm:flex', compared ? 'border-accent bg-accent text-accent-ink' : 'border-line text-secondary')}>{compared ? <Check size={16} /> : <Plus size={16} />}</button>
    </article>
  );
}

function Drawer({ title, children, onClose, wide }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div className={clsx('h-full w-full overflow-y-auto bg-page p-4 shadow-2xl sm:p-6', wide ? 'max-w-[980px]' : 'max-w-[380px]')} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h2 className="text-[16px] font-extrabold text-display">{title}</h2><button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-raised"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}

function Sheet({ r, rank, rf, m }: { r: Row; rank: number; rf: RowsFile; m: Manifest }) {
  const d = useDetail(r.id, m.shards);
  const [img, setImg] = useState(0);
  const groups = GROUPS.filter((g) => !['brand', 'dept', 'stock'].includes(g.id)).map((g) => [g.label, labelsOf(r, rf, g.id)] as const).filter(([, l]) => l.length);
  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div>
        <div className="aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-line"><img src={d?.images[img] ?? r.img} alt={r.n} className="h-full w-full object-contain" /></div>
        <div className="mt-2 flex flex-wrap gap-2">{d?.images.map((u, i) => <button type="button" key={u} onClick={() => setImg(i)} className={clsx('h-14 w-14 overflow-hidden rounded-lg bg-white ring-2', i === img ? 'ring-accent' : 'ring-line')}><img src={u} alt="" className="h-full w-full object-contain" /></button>)}</div>
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-accent">{r.b} · {catLabel(r, m)} {rank > 0 && <span className="text-muted">· #{rank} in current list</span>}</p>
        <h3 className="mt-1 text-[22px] font-extrabold leading-tight text-display">{r.n}</h3>
        {r.u && <p className="text-[14px] text-secondary">{r.u}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-4"><Score s={r.s} big /><span className="text-[13px] text-secondary">{rupees(r.p)}{r.m && r.p && r.m > r.p ? <s className="ml-1 text-muted">{rupees(r.m)}</s> : null} · not scored</span></div>
        {d && <a href={d.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[14px] font-bold text-accent-ink">Buy on {d.source} <ExternalLink size={14} /></a>}
        <div className="card mt-4 space-y-2 p-4">{(Object.keys(m.weights) as Dim[]).map((k) => <Bar key={k} label={DIM_LABEL[k]} v={r.sc[k]} w={m.weights[k]} />)}
          {d && <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[12px] text-secondary">{d.reasons.map((x) => <li key={x}>{x}</li>)}</ul>}</div>
        <div className="mt-4 space-y-2">{groups.map(([l, v]) => <div key={l} className="text-[13px]"><span className="font-bold text-display">{l}: </span><span className="text-secondary">{v.join(' · ')}</span></div>)}</div>
        {d && (
          <div className="mt-4 space-y-3 text-[14px] text-secondary">
            {d.desc && <p className="whitespace-pre-line">{d.desc}</p>}
            {Object.entries(d.bullets.reduce((a, b) => ((a[b.section] ??= []).push(b.text), a), {} as Record<string, string[]>)).map(([s, xs]) => <div key={s}><p className="font-bold text-display">{s}</p><ul className="list-disc pl-5">{xs.map((x) => <li key={x}>{x}</li>)}</ul></div>)}
            <table className="w-full text-[13px]"><tbody>
              {([['Materials', d.materials.join('; ')], ['Care', d.care.join('; ')], ['Colour', d.colour], ['Colourways', String(d.colours)], ['Style code', d.style], ['Country of origin', d.origin], ['Sizes in stock', d.sizes?.join(', ')], ['Store category', d.path.join(' › ')], ...Object.entries(d.attrs)] as [string, string | null | undefined][]).map(([k, val]) => (
                <tr key={k} className="border-t border-line align-top"><td className="w-40 py-1.5 pr-3 font-bold text-display">{k}</td><td className="py-1.5">{val || <span className="text-muted">Not published</span>}</td></tr>
              ))}
            </tbody></table>
          </div>
        )}
      </div>
    </div>
  );
}

function Compare({ ids, byId, rf, m }: { ids: string[]; byId: Map<string, Row>; rf: RowsFile; m: Manifest }) {
  const rows = ids.map((id) => byId.get(id)!).filter(Boolean);
  const best = (f: (r: Row) => number) => Math.max(...rows.map(f));
  const line = (label: string, f: (r: Row) => React.ReactNode, num?: (r: Row) => number) => (
    <tr className="border-t border-line align-top"><td className="py-2 pr-3 text-[13px] font-bold text-display">{label}</td>{rows.map((r) => <td key={r.id} className={clsx('py-2 pr-3 text-[13px]', num && num(r) === best(num) && 'font-extrabold text-[var(--success)]')}>{f(r)}</td>)}</tr>
  );
  return (
    <div className="overflow-x-auto"><table className="w-full min-w-[640px]"><thead><tr><th />{rows.map((r) => <th key={r.id} className="w-1/4 p-2 text-left align-top"><img src={r.img} alt="" className="h-28 w-full rounded-lg bg-white object-contain ring-1 ring-line" /><p className="mt-1 text-[12px] font-bold text-accent">{r.b}</p><p className="text-[13px] font-bold text-display">{r.n}</p></th>)}</tr></thead>
      <tbody>
        {line('Quality score', (r) => r.s.toFixed(1), (r) => r.s)}
        {(Object.keys(m.weights) as Dim[]).map((k) => line(DIM_LABEL[k], (r) => r.sc[k], (r) => r.sc[k]))}
        {line('Category', (r) => catLabel(r, m))}
        {GROUPS.filter((g) => !['brand', 'dept', 'cat'].includes(g.id)).map((g) => line(g.label, (r) => labelsOf(r, rf, g.id).join(', ') || '—'))}
        {line('Rating', (r) => (r.r != null ? `${r.r.toFixed(1)} (${r.rc})` : 'Not shown by store'))}
        {line('Price (not scored)', (r) => rupees(r.p))}
      </tbody></table></div>
  );
}
