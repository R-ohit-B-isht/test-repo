import { ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import type { Evidence, SourceRef } from '../../lib/types';
import { INCI_META } from '../../domain/scoreMeta';

interface Props { evidence: Evidence; sources: Record<string, SourceRef> }

const GRADE = { A: 'RCT / systematic-review evidence', B: 'Controlled clinical studies', C: 'Mechanistic or small studies' } as const;

function Cite({ src, sources }: { src: string; sources: Record<string, SourceRef> }) {
  const s = sources[src];
  if (!s) return null;
  return (
    <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-accent underline-offset-2 hover:underline">
      {s.label.length > 64 ? `${s.label.slice(0, 62)}…` : s.label} <ExternalLink size={10} aria-hidden />
    </a>
  );
}

/** What the score was actually read from — INCI list, cited actives and irritants, verified maker, buyer ratings.
 *  Anything not available is shown as unscored; seller adjectives never appear here. */
export function EvidencePanel({ evidence: ev, sources }: Props) {
  const meta = INCI_META[ev.inci];
  const verified = ev.inci === 'full';
  return (
    <section aria-labelledby="evidence-h" className="card p-5">
      <h3 id="evidence-h" className="text-[15px] font-extrabold text-display">Evidence behind the score</h3>
      <p className="mt-0.5 text-[12px] text-muted">Seller claims (“dermatologically tested”, “paraben-free”, “brightening”) score 0 — only what is below counts.</p>

      <div className="mt-4 space-y-4 text-[13px]">
        <div>
          <p className={clsx('font-bold', meta.tone === 'good' ? 'text-success' : meta.tone === 'warn' ? 'text-warning' : 'text-muted')}>{meta.label}</p>
          {ev.inciSource && <p className="mt-0.5 text-[12px] text-secondary">Read from: {ev.inciSource}</p>}
          {ev.inciNote && <p className="mt-0.5 text-[12px] text-warning">{ev.inciNote}</p>}
          {verified && ev.inciText && <p className="mt-2 rounded-lg bg-raised p-3 text-[12px] leading-relaxed text-primary">{ev.inciText}</p>}
          {!verified && ev.inciUnverified && (
            <p className="mt-2 rounded-lg bg-raised p-3 text-[12px] leading-relaxed text-secondary"><span className="font-bold text-warning">Unverified seller text (not scored): </span>{ev.inciUnverified}</p>
          )}
          {ev.declarationConfidence !== null && ev.declarationConfidence < 1 && (
            <p className="mt-1 text-[12px] text-secondary">Declared by an unidentified maker — formula and safety counted at {Math.round(ev.declarationConfidence * 100)}%.</p>
          )}
        </div>

        <div>
          <p className="label">Formula · evidence-graded actives</p>
          {!verified ? <p className="mt-1 text-muted">Unscored — no verified INCI list.</p>
            : ev.actives.length === 0 ? <p className="mt-1 text-secondary">No category-relevant evidence-backed active on the list.</p>
            : (
              <ul className="mt-1 space-y-1.5">
                {ev.actives.map((a) => (
                  <li key={a.name} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-bold text-display">{a.name}</span>
                    <span className="text-secondary">#{a.position} on list · grade {a.grade}{a.core ? '' : ' (supporting)'} — {GRADE[a.grade]}</span>
                    <Cite src={a.src} sources={sources} />
                  </li>
                ))}
              </ul>
            )}
          {ev.formulaNotes.map((n) => <p key={n} className="mt-1 text-[12px] text-secondary">{n}</p>)}
        </div>

        <div>
          <p className="label">Skin safety · named irritants on the list</p>
          {!verified ? <p className="mt-1 text-muted">Unscored — no verified INCI list.</p>
            : ev.flags.length === 0 ? <p className="mt-1 text-success">No flagged fragrance, allergen, drying alcohol or harsh surfactant on the list.</p>
            : (
              <ul className="mt-1 space-y-1.5">
                {ev.flags.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-bold text-warning">{f.label}</span>
                    <span className="text-secondary">{f.names.join(', ')} · −{f.penalty}</span>
                    <Cite src={f.src} sources={sources} />
                  </li>
                ))}
              </ul>
            )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="label">Maker accountability</p>
            <p className="mt-1 font-bold text-display">{ev.maker.parent ?? 'Maker not verified'}</p>
            <p className="text-[12px] text-secondary">{ev.maker.label}{ev.maker.url && <> · <a href={ev.maker.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">source</a></>}</p>
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
