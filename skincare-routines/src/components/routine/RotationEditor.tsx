import type { ReactNode } from 'react';
import { ChevronDown, ChevronUp, Plus, Repeat, Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { ListingPicker } from './ListingPicker';
import type { Rotation, StepProduct, StepVariant } from '../../schedule/model';
import { anchorFor, cycleIndex, MAX_ALTERNATIVES, shiftWeek, weekMonday } from '../../schedule/rotation';

interface Props {
  /** The step's own title / product — position 1 of the cycle, edited by the fields above this block. */
  base: StepVariant;
  rotation: Rotation | undefined;
  categoryLabel: (id: string) => string;
  onChange: (rotation: Rotation | undefined) => void;
  /** Alternative positions (0-based within `rotation.alternatives`) still missing a name, shown after a failed submit. */
  invalid?: ReadonlySet<number>;
}

const emptyVariant = (): StepVariant => ({ title: '', category: null, product: null, note: '' });

const weekLabel = (monday: string) => {
  const [y, m, d] = monday.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

/** Weekly cycle for one step (Loop Habit Tracker's frequency sheet, made concrete): the step itself is week 1, each added option
 *  takes the next week, then it wraps. Options pin real ranked listings through the same picker as the step. "Start with" moves the
 *  anchor so any option can be this week's; the cycle is otherwise fixed arithmetic on calendar Mondays, so every device agrees. */
export function RotationEditor({ base, rotation, categoryLabel, onChange, invalid }: Props) {
  const monday = weekMonday(new Date());
  if (!rotation) {
    return (
      <button type="button" onClick={() => onChange({ anchor: monday, alternatives: [emptyVariant()] })}
        className="press flex h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-line-strong text-[13px] font-bold text-secondary hover:bg-raised hover:text-display">
        <Repeat size={14} aria-hidden />Rotate with other products week by week
      </button>
    );
  }

  const cycle = [base, ...rotation.alternatives];
  const active = cycleIndex(rotation, monday, cycle.length);
  const patchAlt = (i: number, p: Partial<StepVariant>) =>
    onChange({ ...rotation, alternatives: rotation.alternatives.map((a, k) => (k === i ? { ...a, ...p } : a)) });
  const removeAlt = (i: number) => {
    const alternatives = rotation.alternatives.filter((_, k) => k !== i);
    onChange(alternatives.length ? { ...rotation, alternatives } : undefined);
  };
  const moveAlt = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rotation.alternatives.length) return;
    const alternatives = [...rotation.alternatives];
    [alternatives[i], alternatives[j]] = [alternatives[j], alternatives[i]];
    onChange({ ...rotation, alternatives });
  };
  const pick = (i: number, product: StepProduct | null) => {
    const a = rotation.alternatives[i];
    patchAlt(i, { product, category: product ? product.category : a.category, title: a.title || (product ? categoryLabel(product.category) : '') });
  };

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        <li className={clsx('rounded-[12px] border px-3 py-2.5', active === 0 ? 'border-accent bg-accent-soft/40' : 'border-line bg-surface')}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-bold text-secondary">Week 1 · the step above</p>
            {active === 0 && <span className="rota-chip">this week</span>}
          </div>
          <p className="mt-0.5 truncate text-[13.5px] font-bold text-display">{base.title.trim() || 'Unnamed step'}</p>
          <p className="truncate text-[12px] text-secondary">{base.product ? `${base.product.brand ? `${base.product.brand} · ` : ''}${base.product.title}` : 'No product pinned'}</p>
        </li>
        {rotation.alternatives.map((alt, i) => {
          const pos = i + 1;
          const bad = invalid?.has(i) ?? false;
          return (
            <li key={pos} className={clsx('rounded-[12px] border px-3 py-2.5', active === pos ? 'border-accent bg-accent-soft/40' : bad ? 'border-danger' : 'border-line bg-surface')}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-bold text-secondary">Week {pos + 1}</p>
                <div className="flex items-center gap-1">
                  {active === pos && <span className="rota-chip mr-1">this week</span>}
                  <RowBtn label={`Move week ${pos + 1} earlier`} onClick={() => moveAlt(i, -1)} disabled={i === 0}><ChevronUp size={14} /></RowBtn>
                  <RowBtn label={`Move week ${pos + 1} later`} onClick={() => moveAlt(i, 1)} disabled={i === rotation.alternatives.length - 1}><ChevronDown size={14} /></RowBtn>
                  <RowBtn label={`Remove week ${pos + 1} from the cycle`} onClick={() => removeAlt(i)} danger><Trash2 size={14} /></RowBtn>
                </div>
              </div>
              <input className="field mt-2 w-full" value={alt.title} maxLength={80} placeholder="Name for this week, e.g. Retinol"
                aria-label={`Week ${pos + 1} step name`} aria-invalid={bad} onChange={(e) => patchAlt(i, { title: e.target.value })} />
              {bad && <p className="mt-1 text-[12px] font-semibold text-danger" role="alert">Name this week’s option or remove it.</p>}
              <div className="mt-2">
                <ListingPicker product={alt.product} category={alt.category} categoryLabel={categoryLabel} onChange={(p) => pick(i, p)} />
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-1.5">
        {rotation.alternatives.length < MAX_ALTERNATIVES && (
          <button type="button" className="btn h-9" onClick={() => onChange({ ...rotation, alternatives: [...rotation.alternatives, emptyVariant()] })}>
            <Plus size={13} aria-hidden />Add week {cycle.length + 1}
          </button>
        )}
        <button type="button" className="btn h-9" onClick={() => onChange(undefined)}><X size={13} aria-hidden />Stop rotating</button>
      </div>

      <div>
        <p className="text-[12px] font-bold text-secondary">Start with, this week ({weekLabel(monday)})</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Which option is this week’s">
          {cycle.map((v, i) => (
            <button key={i} type="button" role="radio" aria-checked={active === i} aria-pressed={active === i} className="chip h-8 px-3 text-[12px]"
              onClick={() => onChange({ ...rotation, anchor: anchorFor(monday, i) })}>
              <span className="text-muted">{i + 1}</span>{v.title.trim() || `Week ${i + 1}`}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[12px] text-muted">
          Then week {((active + 1) % cycle.length) + 1}{cycle[(active + 1) % cycle.length].title.trim() ? ` (${cycle[(active + 1) % cycle.length].title.trim()})` : ''} from {weekLabel(shiftWeek(monday, 1))}, cycling every {cycle.length} weeks.
        </p>
      </div>
    </div>
  );
}

function RowBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label}
      className={clsx('press flex h-8 w-8 items-center justify-center rounded-full text-secondary hover:bg-raised hover:text-display disabled:opacity-30 disabled:hover:bg-transparent', danger && 'hover:text-danger')}>
      {children}
    </button>
  );
}
