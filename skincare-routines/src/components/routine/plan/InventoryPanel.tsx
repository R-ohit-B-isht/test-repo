import { useMemo } from 'react';
import { ArrowRight, CalendarDays, Square } from 'lucide-react';
import { CATALOG_BY_KEY, type Role } from '../../../schedule/planner/catalog';
import { previewInventory } from '../../../schedule/plannerStore';
import { ZONE_LABEL } from '../../../schedule/model';

interface Props {
  input: string;
  restNights: number;
  running: boolean;
  canBuild: boolean;
  onInput: (v: string) => void;
  onRestNights: (n: number) => void;
  onBuild: () => void;
  onStop: () => void;
  /** Dev mode only: drops a long real-world list into the box to exercise the planner. */
  example: string | null;
}

const ROLE_LABEL: Record<Role, string> = { core: 'Every day', protect: 'Protect', hydrate: 'Hydrate & soothe', treat: 'Treatments', active: 'Strong actives (spaced out)' };
const ROLE_ORDER: Role[] = ['core', 'protect', 'hydrate', 'treat', 'active'];

/** Stage 2 — free text in, recognised items out (MyFitnessPal chip groups). Unknown words are listed, never guessed at. */
export function InventoryPanel({ input, restNights, running, canBuild, onInput, onRestNights, onBuild, onStop, example }: Props) {
  const preview = useMemo(() => previewInventory(input), [input]);
  const groups = ROLE_ORDER.map((role) => ({
    role,
    items: preview.items.filter((it) => CATALOG_BY_KEY.get(it.key)?.role === role).map((it) => ({ ...it, item: CATALOG_BY_KEY.get(it.key)! })),
  })).filter((g) => g.items.length);
  const carried = preview.items.filter((it) => CATALOG_BY_KEY.get(it.key)?.ingredientOnly);

  return (
    <section className="card p-5" aria-labelledby="inv-head">
      <h2 id="inv-head" className="text-[20px] text-display">What do you have, or want to use?</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-secondary">
        Type products or ingredients in any order — "retinol, glycolic 2x, azelaic, sunscreen…". Add "2x" or "3 nights" to cap how often something is used; the planner spaces the rest.
      </p>
      <label htmlFor="inv-text" className="sr-only">Products and ingredients you have</label>
      <textarea id="inv-text" className="field mt-4 min-h-[112px] w-full resize-y py-2.5 leading-relaxed" maxLength={1200} value={input} disabled={running}
        onChange={(e) => onInput(e.target.value)} placeholder="face wash, retinol, glycolic acid, azelaic, niacinamide, salicylic, moisturizer, sunscreen, vitamin c, hyaluronic acid, ceramide…" />
      {example && !input && (
        <button type="button" className="mt-2 text-[12px] font-bold text-accent underline-offset-2 hover:underline" onClick={() => onInput(example)}>Dev: paste the long example list</button>
      )}

      <div className="mt-4 min-h-[44px]" aria-live="polite">
        {groups.length === 0 ? (
          <p className="text-[13px] text-muted">{input.trim() ? 'Nothing recognised yet — try product names (cleanser, toner, serum) or ingredients (retinol, glycolic acid).' : 'Recognised items show up here as you type.'}</p>
        ) : groups.map((g) => (
          <div key={g.role} className="mt-3 first:mt-0">
            <p className="label">{ROLE_LABEL[g.role]}</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {g.items.map(({ key, days, item }) => (
                <li key={key} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-raised/60 px-2.5 text-[12.5px] font-bold text-display">
                  {item.label}
                  {item.role === 'active' && <span className="mono text-[11px] font-semibold text-secondary">{days}×/wk</span>}
                  {item.zone !== 'face' && <span className="text-[11px] font-semibold text-muted">{ZONE_LABEL[item.zone]}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {carried.length > 0 && (
          <p className="mt-3 text-[12px] text-secondary">
            {carried.map((c) => CATALOG_BY_KEY.get(c.key)?.label).join(', ')}: ingredients rather than steps — the planner looks for them inside your moisturiser / hydrating serum instead of adding a layer each.
          </p>
        )}
        {preview.unknown.length > 0 && (
          <p className="mt-3 text-[12px] text-secondary"><span className="font-bold text-primary">Not understood:</span> {preview.unknown.join(', ')} — left out rather than guessed.</p>
        )}
      </div>

      <div className="mt-5 border-t border-line pt-4" role="group" aria-labelledby="rest-head">
        <p id="rest-head" className="label flex items-center gap-1.5"><CalendarDays size={13} aria-hidden />Rest nights (no strong actives)</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[0, 1, 2, 3].map((n) => (
            <button key={n} type="button" className="chip h-9" aria-pressed={restNights === n} disabled={running} onClick={() => onRestNights(n)}>{n === 0 ? 'None' : n}</button>
          ))}
        </div>
        <p className="mt-1.5 text-[12px] text-muted">Sensitive skin is held to at least 2 regardless.</p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {running ? (
          <button type="button" className="btn" onClick={onStop}><Square size={13} aria-hidden />Stop</button>
        ) : (
          <button type="button" className="btn btn-accent" onClick={onBuild} disabled={!canBuild || preview.items.length === 0}>Build my week<ArrowRight size={14} aria-hidden /></button>
        )}
        <p className="text-[12px] text-muted">{canBuild ? 'Spacing and pairing come from the sourced pairing rules — no model guesses.' : 'Pick at least one zone in the setup first.'}</p>
      </div>
    </section>
  );
}
