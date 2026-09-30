import { useMemo } from 'react';
import { clsx } from 'clsx';
import { ArrowRight, Check, ListFilter, Minus, Plus, Star, X } from 'lucide-react';
import { AppLink } from '../ui/AppLink';
import { EvidenceBadge, ScoreBadge } from '../ui/primitives';
import { SizeTier } from './planUi';
import { dims, litres, litresOf } from '../../domain/pack';
import { activatePick, addPick, removePick, setInto, setQty, type PlanPick } from '../../state/planStore';
import { toast } from '../../state/toastStore';
import { rupees, storeLabel } from '../../lib/format';
import type { CategoryMeta, PackBag, PackRole, ProductRow } from '../../lib/types';
import type { CategoryIndex } from '../../domain/index';

interface Props {
  bag: PackBag; role: PackRole; meta: CategoryMeta | undefined; idx: CategoryIndex | undefined;
  picks: PlanPick[]; onOpen: (id: string) => void;
  /** The all-in-one set whose stated contents already cover this role, if any. */
  coveredBy?: ProductRow | null;
}

/**
 * One packing job: the counted pick with quantity / compartment controls, its alternatives, and the way into the
 * ranked list to choose something else. The "best available" shortcut is the top-scored listing with a verified
 * (non-claim) size that is not already in the plan — the same rule the whole-plan fill uses.
 */
export function RoleCard({ bag, role, meta, idx, picks, onOpen, coveredBy = null }: Props) {
  const rowOf = useMemo(() => new Map(idx?.items.map((r) => [r.id, r]) ?? []), [idx]);
  const active = picks.find((p) => p.active) ?? null;
  const alts = picks.filter((p) => !p.active);
  const best = useMemo(() => {
    const taken = new Set(picks.map((p) => p.id));
    return idx?.items.filter((r) => r.pk && r.pk.tier !== 'claimed' && !taken.has(r.id)).sort((a, b) => b.s - a.s || a.p - b.p)[0];
  }, [idx, picks]);
  const browse = `/c/${role.category}?role=${role.id}`;

  const useBest = () => {
    if (!best) return;
    addPick(bag.id, role.id, best.id, role.into, role.qty, true);
    toast(`${best.b} placed for ${role.label.toLowerCase()}`, { label: 'Undo', run: () => removePick(bag.id, role.id, best.id) });
  };

  return (
    <article className={clsx('card p-4 sm:p-5', coveredBy && !active && 'border-dashed')} aria-labelledby={`role-${role.id}`} data-role-card={role.id} data-covered={coveredBy && !active ? 'set' : undefined}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`role-${role.id}`} className="flex flex-wrap items-center gap-2 text-[18px] font-extrabold text-display">{role.label}{coveredBy && !active && <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success"><Check size={11} aria-hidden />Covered by your set</span>}</h3>
          <p className="mt-0.5 text-[13px] text-secondary">{role.what}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {best && <button type="button" onClick={useBest} className="btn h-9 px-3"><Star size={14} aria-hidden />{active ? 'Add best as alternative' : coveredBy ? 'Add a separate one anyway' : 'Use best available'}</button>}
          <AppLink to={browse} className="btn h-9 px-3 no-underline"><ListFilter size={14} aria-hidden />Pick from {meta?.count.toLocaleString('en-IN') ?? ''} {meta?.label.toLowerCase() ?? role.category}<ArrowRight size={14} aria-hidden /></AppLink>
        </div>
      </header>

      {active ? (
        <PickRow bag={bag} roleId={role.id} roleLabel={role.label} pick={active} row={rowOf.get(active.id)} onOpen={onOpen} />
      ) : coveredBy ? (
        <p className="mt-4 rounded-lg border border-dashed border-line-strong p-4 text-[13px] text-secondary">
          The stated contents of <span className="font-bold text-display">{coveredBy.b} {coveredBy.m}</span> include a piece for {role.label.toLowerCase()}, so this role is counted inside that set. Add a separate organiser only if you want one on top.
        </p>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-line-strong p-4 text-[13px] text-secondary">
          Nothing placed for {role.label.toLowerCase()} yet. {best ? <>Best available with a verified size: <button type="button" onClick={useBest} className="font-bold text-accent underline-offset-2 hover:underline">{best.b} {best.m}</button> ({litres(litresOf(best.pk!, role.qty))}, {rupees(best.p)}).</> : 'No listing in this category states a verified size, so nothing can be counted here automatically.'}
        </p>
      )}

      {alts.length > 0 && (
        <div className="mt-4">
          <p className="label">Alternatives ({alts.length}) · tap Use to count one instead</p>
          <ul className="mt-2 space-y-2">
            {alts.map((p) => {
              const r = rowOf.get(p.id);
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-lg border border-line p-2">
                  {r ? (
                    <>
                      <button type="button" onClick={() => onOpen(r.id)} className="h-12 w-10 shrink-0 overflow-hidden rounded bg-white ring-1 ring-line" aria-label={`Open details for ${r.b} ${r.m}`}><img src={r.img} alt="" loading="lazy" className="h-full w-full object-contain" /></button>
                      <button type="button" onClick={() => onOpen(r.id)} className="min-w-0 flex-1 text-left">
                        <p className="truncate text-[13px] font-bold text-display"><span className="text-accent">{r.b}</span> {r.m}</p>
                        <p className="mt-0.5 truncate text-[12px] text-secondary">{r.pk ? `${dims(r.pk.d)} · ${litres(litresOf(r.pk, p.qty))}` : 'no accepted size'} · {rupees(r.p)} · {r.s.toFixed(1)}</p>
                      </button>
                    </>
                  ) : <p className="min-w-0 flex-1 truncate text-[13px] text-muted">Listing {p.id} is no longer in the data</p>}
                  <button type="button" onClick={() => activatePick(bag.id, role.id, p.id)} className="btn h-8 px-3"><Check size={13} aria-hidden />Use</button>
                  <button type="button" onClick={() => removePick(bag.id, role.id, p.id)} className="btn h-8 w-8 px-0" aria-label="Remove alternative"><X size={13} aria-hidden /></button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </article>
  );
}

/** The counted listing of one role (or of the all-in-one set) with its size arithmetic, quantity and compartment controls. */
export function PickRow({ bag, roleId, roleLabel, pick, row, onOpen, children }: { bag: PackBag; roleId: string; roleLabel: string; pick: PlanPick; row: ProductRow | undefined; onOpen: (id: string) => void; children?: React.ReactNode }) {
  if (!row) {
    return <p className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-line p-3 text-[13px] text-muted">The counted listing ({pick.id}) is no longer in the data.<button type="button" onClick={() => removePick(bag.id, roleId, pick.id)} className="btn h-8 px-3">Remove</button></p>;
  }
  const size = row.pk ?? null;
  const total = size ? litresOf(size, pick.qty) : null;
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-[72px_minmax(0,1fr)]">
      <button type="button" onClick={() => onOpen(row.id)} className="press h-[88px] w-[72px] overflow-hidden rounded-lg bg-white ring-1 ring-line" aria-label={`Open details for ${row.b} ${row.m}`}>
        <img src={row.img} alt="" loading="lazy" decoding="async" width={72} height={88} className="h-full w-full object-contain" />
      </button>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <button type="button" onClick={() => onOpen(row.id)} className="min-w-0 text-left">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className="text-[12px] font-bold text-accent">{row.b}</span><EvidenceBadge status={row.ev} verified={row.vf} /></div>
            <p className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-snug text-display">{row.m}</p>
            <p className="mt-1 text-[13px] text-secondary">{row.q} · {storeLabel(row.st)}</p>
          </button>
          <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
            <ScoreBadge score={row.s} className="sm:flex-row-reverse" />
            <p className="mono text-[15px] font-extrabold text-display">{rupees(row.p)}{pick.qty > 1 && <span className="text-[12px] font-bold text-secondary"> × {pick.qty}</span>}</p>
          </div>
        </div>

        <dl className="mt-3 grid gap-3 rounded-lg bg-raised p-3 text-[13px] sm:grid-cols-[1fr_auto_auto]">
          <div className="min-w-0">
            <dt className="label">Counted as</dt>
            <dd className="mono mt-0.5 font-extrabold text-display">{size ? <>{dims(size.d)}{size.n > 1 ? ` + ${size.n - 1} smaller ≈ ${litres(size.s)}` : ''}{pick.qty > 1 ? ` × ${pick.qty} sets` : ''} = {litres(total!)}</> : 'not counted'}</dd>
            <dd className="mt-0.5"><SizeTier size={size} /></dd>
          </div>
          <div>
            <dt className="label">Sets</dt>
            <dd className="mt-0.5 inline-flex items-center rounded-lg border border-line">
              <button type="button" onClick={() => setQty(bag.id, roleId, pick.id, pick.qty - 1)} disabled={pick.qty <= 1} className="flex h-8 w-8 items-center justify-center disabled:opacity-30" aria-label="One set fewer"><Minus size={13} /></button>
              <span className="mono w-6 text-center font-extrabold text-display" aria-live="polite">{pick.qty}</span>
              <button type="button" onClick={() => setQty(bag.id, roleId, pick.id, pick.qty + 1)} disabled={pick.qty >= 9} className="flex h-8 w-8 items-center justify-center disabled:opacity-30" aria-label="One set more"><Plus size={13} /></button>
            </dd>
          </div>
          <div>
            <dt className="label">Packed in</dt>
            <dd className="mt-0.5 inline-flex rounded-lg border border-line p-0.5" role="radiogroup" aria-label="Compartment">
              {bag.compartments.map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={pick.into === c.id} onClick={() => setInto(bag.id, roleId, pick.id, c.id)}
                  className={clsx('h-7 rounded-md px-2.5 text-[12px] font-bold', pick.into === c.id ? 'bg-primary text-page' : 'text-secondary hover:text-primary')}>{c.id === 'main' ? 'Main body' : 'Day pack'}</button>
              ))}
            </dd>
          </div>
        </dl>
        {children}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => onOpen(row.id)} className="btn h-8 px-3">Details & evidence</button>
          <button type="button" onClick={() => { removePick(bag.id, roleId, pick.id); toast(`${row.b} removed from ${roleLabel.toLowerCase()}`, { label: 'Undo', run: () => addPick(bag.id, roleId, row.id, pick.into, pick.qty, true, pick.category) }); }} className="btn h-8 px-3"><X size={13} aria-hidden />Remove</button>
        </div>
      </div>
    </div>
  );
}
