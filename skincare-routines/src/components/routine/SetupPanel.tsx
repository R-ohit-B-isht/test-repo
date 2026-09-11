import type { ReactNode } from 'react';
import { Sparkles, Square } from 'lucide-react';
import { PLAN_ZONES, SKIN_TYPES, ZONE_LABEL, type PlanZone, type Setup, type SkinType } from '../../schedule/model';

interface Props {
  setup: Setup;
  concerns: { id: string; label: string }[];
  filling: boolean;
  onChange: (patch: Partial<Setup>) => void;
  onFill: () => void;
  onStop: () => void;
}

const SKIN_LABEL: Record<SkinType, string> = { oily: 'Oily', combination: 'Combination', normal: 'Normal', dry: 'Dry', sensitive: 'Sensitive' };
const BUDGETS = [500, 1000, 2000];

/** Calm-style goal setup: what the plan is for. Everything here is sent to the assistant as plain context; nothing is scored. */
export function SetupPanel({ setup, concerns, filling, onChange, onFill, onStop }: Props) {
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const canFill = setup.zones.length > 0;
  return (
    <section className="card p-5" aria-labelledby="setup-head">
      <h2 id="setup-head" className="text-[20px] text-display">Your setup</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-secondary">The assistant reads this, then picks steps and real listings from the site's rankings. You decide what stays.</p>

      <Group label="Zones" hint={setup.zones.length === 0 ? 'Pick at least one.' : undefined}>
        {PLAN_ZONES.map((z) => (
          <button key={z} type="button" className="chip h-9" aria-pressed={setup.zones.includes(z)} onClick={() => onChange({ zones: PLAN_ZONES.filter((x) => toggle<PlanZone>(setup.zones, z).includes(x)) })}>{ZONE_LABEL[z]}</button>
        ))}
      </Group>

      <Group label="Skin type">
        {SKIN_TYPES.map((t) => (
          <button key={t} type="button" role="radio" aria-checked={setup.skinType === t} aria-pressed={setup.skinType === t} className="chip h-9"
            onClick={() => onChange({ skinType: setup.skinType === t ? null : t })}>{SKIN_LABEL[t]}</button>
        ))}
      </Group>

      {concerns.length > 0 && (
        <Group label="Concerns">
          {concerns.map((c) => (
            <button key={c.id} type="button" className="chip h-9" aria-pressed={setup.concerns.includes(c.id)} onClick={() => onChange({ concerns: toggle(setup.concerns, c.id) })}>{c.label}</button>
          ))}
        </Group>
      )}

      <Group label="Budget per product" hint="Passed to the ranking as a price cap; price is never part of the score.">
        <button type="button" className="chip h-9" aria-pressed={setup.maxPriceInr === null} onClick={() => onChange({ maxPriceInr: null })}>Any</button>
        {BUDGETS.map((b) => (
          <button key={b} type="button" className="chip h-9" aria-pressed={setup.maxPriceInr === b} onClick={() => onChange({ maxPriceInr: b })}>Under ₹{b.toLocaleString('en-IN')}</button>
        ))}
        <label className="flex h-9 items-center gap-1.5 text-[13px] font-bold text-secondary">
          <span className="sr-only">Custom budget in rupees</span>₹
          <input type="number" inputMode="numeric" min={50} max={50000} step={50} className="field h-9 w-24 px-2.5" placeholder="custom"
            value={setup.maxPriceInr && !BUDGETS.includes(setup.maxPriceInr) ? setup.maxPriceInr : ''}
            onChange={(e) => onChange({ maxPriceInr: e.target.value ? Math.max(50, Math.min(50000, Number(e.target.value))) : null })} />
        </label>
      </Group>

      <div className="mt-5">
        <label htmlFor="setup-notes" className="label">Anything else</label>
        <textarea id="setup-notes" className="field mt-2 min-h-[72px] w-full resize-y py-2.5 leading-relaxed" maxLength={600} value={setup.notes}
          onChange={(e) => onChange({ notes: e.target.value })} placeholder="e.g. Pregnant — no retinoids. Fragrance gives me hives. Beard oil only on weekends." />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
        {filling ? (
          <button type="button" className="btn" onClick={onStop}><Square size={13} aria-hidden />Stop</button>
        ) : (
          <button type="button" className="btn btn-accent" onClick={onFill} disabled={!canFill}><Sparkles size={14} aria-hidden />Fill my routine</button>
        )}
        <p className="text-[12px] text-muted">Proposals appear below as pending cards — accept, edit or reject each one.</p>
      </div>
    </section>
  );
}

function Group({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="mt-5" role="group" aria-label={label}>
      <p className="label">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-[12px] text-muted">{hint}</p>}
    </div>
  );
}
