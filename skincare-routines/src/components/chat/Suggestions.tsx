import { Sparkles } from 'lucide-react';
import type { Manifest } from '../../lib/types';
import type { Suggestion } from '../../chat/suggestions';

interface Props { items: Suggestion[]; onPick: (q: string) => void; manifest: Manifest | null }

/** Empty state (Yelp 73 / Perplexity 03): what the assistant can see, then live prompt rows built from the manifest + current page. */
export function Suggestions({ items, onPick, manifest }: Props) {
  return (
    <div className="flex h-full flex-col">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden><Sparkles size={18} /></span>
      <h2 className="mt-4 text-[22px] font-extrabold leading-tight tracking-tight text-display">Ask about ingredients, routines or any product here.</h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-secondary">
        Gemini reads the same data as these pages{manifest ? ` — ${manifest.total.toLocaleString('en-IN')} live Flipkart & Amazon.in listings across ${manifest.categories.length} categories, dataset ${new Date(manifest.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}.
        Ranks, scores and INCI provenance come from the site’s tools; ingredient advice draws on {manifest?.knowledge ? `${manifest.knowledge.pairings} sourced pairing notes` : 'sourced pairing notes'} and is labelled as general guidance.
      </p>
      {items.length > 0 && (
        <ul className="mt-5 divide-y divide-line border-y border-line" aria-label="Suggested questions">
          {items.map((s) => (
            <li key={s.text}>
              <button type="button" onClick={() => onPick(s.text)} className="group flex w-full items-start gap-3 py-2.5 text-left">
                <span className="label mt-0.5 w-[88px] shrink-0 truncate text-[11px]">{s.kicker}</span>
                <span className="flex-1 text-[13.5px] font-semibold leading-snug text-primary group-hover:text-accent">{s.text}</span>
                <span className="mt-0.5 text-muted opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>↗</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
