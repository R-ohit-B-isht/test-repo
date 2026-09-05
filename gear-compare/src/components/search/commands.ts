import type { CategoryMeta, FamilyKey } from '../../lib/types';

export interface Command {
  id: string;
  kind: 'category' | 'segment' | 'evidence' | 'surprise' | 'query';
  section: 'On this page' | 'Categories' | 'One size class only' | 'Maker-verified only' | 'Just browsing';
  label: string;
  hint?: string;
  keywords?: string;
  family?: FamilyKey;
  familyLabel?: string;
  count?: number;
  to: string;
}

const dev = (to: string, on: boolean) => (on ? `${to}${to.includes('?') ? '&' : '?'}dev=1` : to);

/** Everything the "Show me…" prompt can jump to is derived from the real manifest — no hand-written destinations. */
export function buildCommands(cats: CategoryMeta[], families: Record<FamilyKey, string>, currentCategory: string | null, isDev: boolean): Command[] {
  const out: Command[] = [];
  if (currentCategory) {
    out.push({ id: 'q', kind: 'query', section: 'On this page', label: 'Search this page', to: dev(`/c/${currentCategory}?q=`, isDev) });
  }
  for (const c of cats) {
    out.push({ id: `c:${c.id}`, kind: 'category', section: 'Categories', label: c.label, hint: c.blurb, keywords: `${c.kicker} ${c.family} ${families[c.family]} ${c.facets.join(' ')}`, family: c.family, familyLabel: families[c.family], count: c.count, to: dev(`/c/${c.id}`, isDev) });
  }
  for (const c of cats) {
    for (const o of c.segment.options) {
      const n = c.bySegment[o.id] ?? 0;
      if (o.id === 'unstated' || n === 0) continue;
      out.push({ id: `s:${c.id}:${o.id}`, kind: 'segment', section: 'One size class only', label: `${c.label} · ${o.label}`, hint: `${c.segment.label}: ${o.label.toLowerCase()}`, keywords: `${c.segment.label} ${o.label}`, family: c.family, familyLabel: families[c.family], count: n, to: dev(`/c/${c.id}?f=${c.segment.key}:${o.id}`, isDev) });
    }
  }
  for (const c of cats) {
    if (c.evidence.official > 0) {
      out.push({ id: `e:${c.id}`, kind: 'evidence', section: 'Maker-verified only', label: `${c.label} · maker-verified`, hint: 'Listings whose specs were read from the maker\u2019s own product page', keywords: 'official verified manufacturer specs', family: c.family, familyLabel: families[c.family], count: c.evidence.official, to: dev(`/c/${c.id}?f=ev:official`, isDev) });
    }
  }
  if (cats.length > 0) {
    const pick = cats[Math.floor(Math.random() * cats.length)];
    out.push({ id: 'surprise', kind: 'surprise', section: 'Just browsing', label: 'Surprise me', hint: `A random category — this time ${pick.label}`, keywords: 'random shuffle any', to: dev(`/c/${pick.id}`, isDev) });
  }
  return out;
}
