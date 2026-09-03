import type { CategoryMeta, Zone } from '../../lib/types';

export interface Command {
  id: string;
  kind: 'category' | 'scope' | 'protocol' | 'surprise' | 'query';
  section: 'On this page' | 'Categories' | 'Face or body only' | 'Protocols' | 'Just browsing';
  label: string;
  hint?: string;
  keywords?: string;
  zone?: Zone | 'unstated';
  count?: number;
  to: string;
}

const dev = (to: string, on: boolean) => (on ? `${to}${to.includes('?') ? '&' : '?'}dev=1` : to);

/** Everything the "Show me…" prompt can jump to is derived from the real manifest — no hand-written destinations. */
export function buildCommands(cats: CategoryMeta[], currentCategory: string | null, isDev: boolean): Command[] {
  const out: Command[] = [];
  if (currentCategory) {
    out.push({ id: 'q', kind: 'query', section: 'On this page', label: 'Search this page', to: dev(`/c/${currentCategory}?q=`, isDev) });
  }
  const protocols = cats.filter((c) => c.id === 'pigmentation');
  const plain = cats.filter((c) => c.id !== 'pigmentation');
  for (const c of plain) {
    out.push({ id: `c:${c.id}`, kind: 'category', section: 'Categories', label: c.label, hint: c.blurb, keywords: `${c.kicker} ${c.zone} ${c.facets.join(' ')}`, zone: c.zone, count: c.count, to: dev(`/c/${c.id}`, isDev) });
  }
  for (const c of plain) {
    if (c.zone !== 'both') continue;
    if (c.byScope.face > 0) out.push({ id: `s:${c.id}:face`, kind: 'scope', section: 'Face or body only', label: `${c.label} · face only`, hint: 'Listings whose seller says face', keywords: 'face', zone: 'face', count: c.byScope.face, to: dev(`/c/${c.id}?f=scope:face`, isDev) });
    if (c.byScope.body > 0) out.push({ id: `s:${c.id}:body`, kind: 'scope', section: 'Face or body only', label: `${c.label} · body only`, hint: 'Listings whose seller says body', keywords: 'body', zone: 'body', count: c.byScope.body, to: dev(`/c/${c.id}?f=scope:body`, isDev) });
  }
  for (const c of protocols) {
    out.push({ id: `p:${c.id}`, kind: 'protocol', section: 'Protocols', label: c.label, hint: c.blurb, keywords: `${c.kicker} old tan melasma dark spots 3 months plan steps`, count: c.count, to: dev(`/c/${c.id}`, isDev) });
  }
  if (plain.length > 0) {
    const pick = plain[Math.floor(Math.random() * plain.length)];
    out.push({ id: 'surprise', kind: 'surprise', section: 'Just browsing', label: 'Surprise me', hint: `A random category — this time ${pick.label}`, keywords: 'random shuffle any', to: dev(`/c/${pick.id}`, isDev) });
  }
  return out;
}
