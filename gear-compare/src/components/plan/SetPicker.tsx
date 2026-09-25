import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Check, ChevronDown, FileCheck, Layers, Ruler, X } from 'lucide-react';
import { EvidenceBadge, ScoreBadge } from '../ui/primitives';
import { CoverTier, FitBadge, RoleCoverage } from './planUi';
import { PickRow } from './RoleCard';
import { dims, litres, litresOf, rankSets, setCandidate, type PlanSummary, type SetCandidate } from '../../domain/pack';
import { addPick, removePick, SET_ROLE, type PlanPick } from '../../state/planStore';
import { toast } from '../../state/toastStore';
import { rupees, storeLabel } from '../../lib/format';
import type { CategoryMeta, PackBag, ProductRow } from '../../lib/types';

interface Props {
  bag: PackBag;
  metaOf: Map<string, CategoryMeta>;
  rowsOf: (category: string) => ProductRow[] | undefined;
  /** Picks with `roleId === SET_ROLE`. */
  picks: PlanPick[];
  summary: PlanSummary;
  onOpen: (category: string, id: string) => void;
}

const FIRST = 6;
const MORE = 30;

/**
 * "One listing for most of it": every set whose stated contents name pieces for two or more roles, ranked by how many
 * roles it covers and how well that is evidenced. Choosing one places it once (not once per role); the roles it does
 * not cover stay open below for individual picks.
 */
export function SetPicker({ bag, metaOf, rowsOf, picks, summary, onOpen }: Props) {
  const all = useMemo(() => rankSets(bag, rowsOf), [bag, rowsOf]);
  const [sizedOnly, setSizedOnly] = useState(false);
  const [statedOnly, setStatedOnly] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const active = picks.find((p) => p.active) ?? null;
  const list = useMemo(
    () => all.filter((c) => (!sizedOnly || (c.row.pk && c.row.pk.tier !== 'claimed')) && (!statedOnly || c.cover.t !== 'claimed')),
    [all, sizedOnly, statedOnly],
  );
  const shown = expanded ? list.slice(0, MORE) : list.slice(0, FIRST);
  const activeRow = summary.set?.row ?? null;
  const activeCand = active && activeRow ? setCandidate(bag, activeRow, active.category ?? '') : null;

  const choose = (c: SetCandidate) => {
    addPick(bag.id, SET_ROLE, c.row.id, bag.compartments[0].id, 1, true, c.category);
    setChoosing(false);
    toast(`${c.row.b} set placed — covers ${c.covered.length} of ${bag.roles.length} roles`, { label: 'Undo', run: () => removePick(bag.id, SET_ROLE, c.row.id) });
  };

  const counts = useMemo(() => {
    const by = new Map<number, number>();
    for (const c of all) by.set(c.covered.length, (by.get(c.covered.length) ?? 0) + 1);
    return [...by.entries()].sort((a, b) => b[0] - a[0]);
  }, [all]);

  return (
    <section aria-labelledby="set" className="mb-10" data-set-picker>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">All-in-one set</p>
          <h2 id="set" className="mt-1 text-[22px] sm:text-[26px]">One listing for most of it</h2>
          <p className="mt-1 max-w-2xl text-[14px] text-secondary">
            Sets whose <em>stated contents</em> name a piece for two or more roles — cubes for clothes plus a shoe bag, toiletry pouch, laundry bag and so on. A bare “7-piece set” earns nothing here; only named pieces count, and a title-only claim is shown as unverified.
            {all.length > 0 && <> {all.length.toLocaleString('en-IN')} sets found{counts.length ? ` (${counts.map(([n, k]) => `${k} cover ${n}`).join(' · ')} roles)` : ''}.</>}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="inline-flex items-center gap-2 text-[13px] font-bold text-secondary">
            <input type="checkbox" checked={statedOnly} onChange={(e) => setStatedOnly(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
            <FileCheck size={14} aria-hidden />Only contents from a spec table or maker page
          </label>
          <label className="inline-flex items-center gap-2 text-[13px] font-bold text-secondary">
            <input type="checkbox" checked={sizedOnly} onChange={(e) => setSizedOnly(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />
            <Ruler size={14} aria-hidden />Only sets with a verified size
          </label>
        </div>
      </div>

      {active && activeRow && activeCand ? (
        <article className="card mt-5 p-4 sm:p-5" aria-label="Your all-in-one set" data-set-active>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-success"><Layers size={15} aria-hidden />Your set · covers {activeCand.covered.length} of {bag.roles.length} roles · counted once</p>
            <button type="button" onClick={() => setChoosing((v) => !v)} className="btn h-8 px-3">{choosing ? 'Keep this set' : 'Choose a different set'}</button>
          </div>
          <PickRow bag={bag} roleId={SET_ROLE} roleLabel="all-in-one set" pick={active} row={activeRow} onOpen={(id) => onOpen(activeCand.category, id)}>
            <div className="mt-3 rounded-lg bg-raised p-3">
              <RoleCoverage roles={bag.roles} covered={new Set(activeCand.cover.r)} />
              <p className="mt-2"><CoverTier cover={activeCand.cover} /></p>
              {activeCand.missing.length > 0 ? (
                <p className="mt-2 text-[13px] text-secondary">Still open, pick separately below: <span className="font-bold text-display">{activeCand.missing.map((r) => r.label).join(', ')}</span>.</p>
              ) : (
                <p className="mt-2 text-[13px] text-secondary">Every role has a named piece in this set. Whether each piece is big enough for your things is not something a listing can tell you.</p>
              )}
            </div>
          </PickRow>
        </article>
      ) : (
        <p className="mt-5 rounded-lg border border-dashed border-line-strong p-4 text-[13px] text-secondary">
          No set chosen. Pick one below to cover several roles with one purchase; anything it leaves out stays open in the roles list.
        </p>
      )}

      {(!active || choosing) && (
        <>
          {list.length === 0 ? (
            <p className="mt-4 text-[13px] text-muted">{sizedOnly || statedOnly ? 'No multi-role set passes these filters — untick one to see sets whose size or contents are stated only in the title.' : 'No listing states contents covering more than one role.'}</p>
          ) : (
            <ol className="mt-4 grid gap-3 md:grid-cols-2" aria-label="Ranked all-in-one sets">
              {shown.map((c, i) => <SetCard key={c.row.id} bag={bag} cand={c} rank={i + 1} meta={metaOf.get(c.category)} current={active?.id === c.row.id} onChoose={() => choose(c)} onOpen={() => onOpen(c.category, c.row.id)} />)}
            </ol>
          )}
          {list.length > FIRST && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="btn mt-4 h-9 px-4" aria-expanded={expanded}>
              <ChevronDown size={14} className={clsx('transition-transform', expanded && 'rotate-180')} aria-hidden />{expanded ? 'Show fewer' : `Show ${Math.min(MORE, list.length) - FIRST} more`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

/** One ranked set: what its stated contents cover, where that was read, and the size floor it is counted at. */
export function SetCard({ bag, cand, rank, meta, current = false, onChoose, onOpen }: { bag: PackBag; cand: SetCandidate; rank: number; meta: CategoryMeta | undefined; current?: boolean; onChoose?: () => void; onOpen: () => void }) {
  const { row, cover } = cand;
  const size = row.pk ?? null;
  return (
    <li className={clsx('card flex min-w-0 flex-col p-4', current && 'ring-2 ring-success')} data-set-card={row.id}>
      <div className="flex gap-3">
        <button type="button" onClick={onOpen} className="press h-[88px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-line" aria-label={`Open details for ${row.b} ${row.m}`}>
          <img src={row.img} alt="" loading="lazy" decoding="async" width={72} height={88} className="h-full w-full object-contain" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="mono text-[11px] font-extrabold text-muted">#{rank}</span>
            <span className="text-[12px] font-bold text-accent">{row.b}</span>
            <EvidenceBadge status={row.ev} verified={row.vf} />
          </div>
          <button type="button" onClick={onOpen} className="mt-0.5 block w-full min-w-0 text-left"><p className="line-clamp-2 break-words text-[14px] font-bold leading-snug text-display">{row.m}</p></button>
          <p className="mt-1 text-[12px] text-secondary">{row.q} · {storeLabel(row.st)} · listed under {meta?.label.toLowerCase() ?? cand.category}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <ScoreBadge score={row.s} className="flex-row-reverse" />
          <p className="mono text-[15px] font-extrabold text-display">{rupees(row.p)}</p>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-raised p-3">
        <p className="text-[13px] font-extrabold text-display">Covers {cand.covered.length} of {bag.roles.length} roles{size && size.n > 1 ? ` · ${size.n} pieces stated` : ''}</p>
        <RoleCoverage roles={bag.roles} covered={new Set(cover.r)} className="mt-2" />
        <p className="mt-2"><CoverTier cover={cover} /></p>
        <p className="mt-2 text-[12px] text-secondary">
          {size ? <>Largest piece {dims(size.d)}{size.n > 1 ? ` + ${size.n - 1} smaller ≈ ${litres(litresOf(size, 1))} for the whole set` : ` = ${litres(litresOf(size, 1))}`} · </> : 'No accepted size · not counted · '}
          {cand.fit ? <FitBadge status={cand.fit} /> : <span className="text-muted">fit unknown</span>}
        </p>
        {size && size.n > 1 && <p className="mt-1 text-[11px] text-muted">A set’s stated size is often the folded pack, not its largest cube — read the litres as a floor.</p>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {current ? <span className="btn h-8 cursor-default px-3 text-success"><Check size={13} aria-hidden />In your plan</span>
          : onChoose && <button type="button" onClick={onChoose} className="btn btn-accent h-8 px-3"><Layers size={13} aria-hidden />Use this set</button>}
        <button type="button" onClick={onOpen} className={clsx('btn h-8 px-3', !onChoose && !current && 'btn-accent')}>{onChoose || current ? 'Details & evidence' : 'Listing, evidence & buy link'}</button>
        {current && <button type="button" onClick={() => removePick(bag.id, SET_ROLE, row.id)} className="btn h-8 px-3"><X size={13} aria-hidden />Remove</button>}
      </div>
    </li>
  );
}
