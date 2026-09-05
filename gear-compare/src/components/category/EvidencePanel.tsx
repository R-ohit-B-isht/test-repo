import { ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import type { Evidence, EvidenceField, FieldTier } from '../../lib/types';
import { EVIDENCE_META, TIER_META, TONE_TEXT } from '../../domain/scoreMeta';

interface Props { evidence: Evidence; tiers: Record<FieldTier, string> }

function TierChip({ tier, tiers }: { tier: FieldTier; tiers: Record<FieldTier, string> }) {
  const m = TIER_META[tier];
  return <span className={clsx('label shrink-0', TONE_TEXT[m.tone])} title={tiers[tier]}>{m.short}</span>;
}

function FieldRow({ f, tiers }: { f: EvidenceField; tiers: Record<FieldTier, string> }) {
  const unscored = f.tier === 'none' || f.tier === 'claimed' || f.tier === 'rejected';
  return (
    <li className="grid grid-cols-[minmax(110px,32%)_1fr_auto] gap-x-3 py-2.5">
      <span className="text-secondary">{f.label}</span>
      <span className="min-w-0">
        <span className={clsx('font-semibold', unscored ? 'font-medium text-muted' : 'text-display')}>
          {f.display ?? (f.tier === 'none' ? 'Not stated' : '—')}
        </span>
        {f.source && (
          <a href={f.source} target="_blank" rel="noopener noreferrer" className="ml-1.5 inline-flex items-center gap-0.5 align-baseline text-[11px] text-accent underline-offset-2 hover:underline" aria-label={`Maker page for ${f.label}`}>
            maker page <ExternalLink size={10} aria-hidden />
          </a>
        )}
        {f.reason && <span className="mt-0.5 block text-[12px] text-danger">{f.reason}</span>}
        {f.conflict && <span className="mt-0.5 block text-[12px] text-warning">{f.conflict}</span>}
      </span>
      <TierChip tier={f.tier} tiers={tiers} />
    </li>
  );
}

/** Field-by-field provenance behind the score: maker page → spec table → claim → rejected → not stated.
 *  Every field in the category schema is listed, so what is missing is as visible as what is verified. */
export function EvidencePanel({ evidence: ev, tiers }: Props) {
  const meta = EVIDENCE_META[ev.status];
  const groups = [...new Set(ev.fields.map((f) => f.group))];
  const counts = ev.counts;
  return (
    <section aria-labelledby="evidence-h" className="card p-5">
      <h3 id="evidence-h" className="text-[15px] font-extrabold text-display">Evidence behind the score</h3>
      <p className="mt-0.5 text-[12px] text-muted">Title and seller-text claims (“fast”, “premium”, “ultra compact”) score 0 — only the fields below count, and only from where they were read.</p>

      <div className="mt-4 space-y-4 text-[13px]">
        <div>
          <p className={clsx('font-bold', TONE_TEXT[meta.tone])}>{meta.label}</p>
          <p className="mt-1 text-[12px] text-secondary">
            {counts.official} on maker page · {counts.listing} in spec table · {counts.claimed} claimed only · {counts.rejected} rejected · {counts.none} not stated
          </p>
          {ev.official && (
            <div className="mt-2 rounded-lg border border-line p-3 text-[12px] leading-relaxed">
              <p className="font-bold text-display">
                {counts.official > 0 ? 'Matched to the maker’s own product page' : 'Maker page found, but it prints no readable spec table — nothing verified from it'}
              </p>
              <p className="mt-1 text-secondary">
                <a href={ev.official.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline">
                  {ev.official.title} <ExternalLink size={10} aria-hidden />
                </a>
              </p>
              <p className="mt-1 text-secondary">
                Matched on: {ev.official.matchedOn.join(' · ')}.
              </p>
              <p className="mt-1 text-secondary">
                Match confidence {Math.round(ev.official.matchScore * 100)}% · {ev.official.region} site · read {ev.official.fetchedAt}. Where the marketplace disagreed, the maker value is used and the disagreement is shown below.
              </p>
            </div>
          )}
          {ev.claims.length > 0 && (
            <p className="mt-2 rounded-lg bg-raised p-3 text-[12px] leading-relaxed text-secondary">
              <span className="font-bold text-warning">Seller claims found in the title (not scored): </span>{ev.claims.join(', ')}
            </p>
          )}
        </div>

        {groups.map((g) => (
          <div key={g}>
            <p className="label">{g}</p>
            <ul className="mt-1 divide-y divide-line">
              {ev.fields.filter((f) => f.group === g).map((f) => <FieldRow key={f.key} f={f} tiers={tiers} />)}
            </ul>
          </div>
        ))}

        <div className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
          <div>
            <p className="label">Maker accountability</p>
            <p className="mt-1 font-bold text-display">{ev.maker.parent ?? 'Maker not verified'}</p>
            <p className="text-[12px] text-secondary">
              {ev.maker.label}
              {ev.maker.url && <> · <a href={ev.maker.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">source</a></>}
              {ev.maker.site && <> · <a href={ev.maker.site} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">official site</a></>}
            </p>
            <p className="mt-1 text-[12px] text-secondary">{ev.maker.warranty}</p>
          </div>
          <div>
            <p className="label">Buyer evidence</p>
            <p className="mt-1 font-bold text-display">{ev.buyers}</p>
            <p className="text-[12px] text-secondary">Capped — supports a score, never carries it.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
