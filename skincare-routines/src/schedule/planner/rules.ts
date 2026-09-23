/** Compatibility rules for placing two things in the same slot of the same day. The verdicts come from the site's sourced
 * pairing knowledge (knowledge.json); the few extra lines here are widely-taught layering conventions and are labelled
 * as general guidance, not evidence. */
import type { Pairing, PairingVerdict } from '../../lib/types';

export interface RuleHit {
  pair: [string, string];
  verdict: PairingVerdict;
  headline: string;
  how: string;
  sourced: boolean;
}

const LOCAL: Omit<RuleHit, 'sourced'>[] = [
  { pair: ['bpo', 'vitc'], verdict: 'caution', headline: 'Benzoyl peroxide oxidises vitamin C', how: 'Different slots: vitamin C in the morning, benzoyl peroxide at night (general guidance).' },
  { pair: ['aha', 'aha'], verdict: 'caution', headline: 'Two exfoliants on one night over-exfoliates', how: 'One exfoliating product per night; give each its own night.' },
  { pair: ['aha', 'bpo'], verdict: 'caution', headline: 'Exfoliant plus benzoyl peroxide stacks dryness', how: 'Separate nights (general guidance).' },
  { pair: ['bha', 'bpo'], verdict: 'caution', headline: 'BHA plus benzoyl peroxide stacks dryness', how: 'Separate nights (general guidance).' },
];

const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export class PairingRules {
  private readonly table = new Map<string, RuleHit>();

  constructor(pairings: Pairing[]) {
    for (const p of pairings) this.table.set(key(p.pair[0], p.pair[1]), { pair: p.pair, verdict: p.verdict, headline: p.headline, how: p.how, sourced: true });
    for (const l of LOCAL) if (!this.table.has(key(l.pair[0], l.pair[1]))) this.table.set(key(l.pair[0], l.pair[1]), { ...l, sourced: false });
  }

  lookup(a: string | null, b: string | null): RuleHit | null {
    if (!a || !b) return null;
    return this.table.get(key(a, b)) ?? null;
  }

  /** True when the two families should not share a slot (the same family twice counts, e.g. two AHA products). */
  clash(a: string | null, b: string | null): RuleHit | null {
    const hit = this.lookup(a, b);
    return hit && (hit.verdict === 'avoid' || hit.verdict === 'caution') ? hit : null;
  }
}
