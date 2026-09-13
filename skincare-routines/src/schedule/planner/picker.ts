/** Finds the real listing for one plan step straight from the site's ranked data — no model involved, so it works in
 * server and browser chat modes alike and even with no Gemini key. The pick is the highest-ranked listing on the step's
 * page that fits the budget and, when the page has them, the skin-type and ingredient tags; filters are relaxed one at a
 * time and every relaxation is reported. Listings the page scopes to the other zone (a body scrub for a face step) are
 * kept out. A named product ("eraser shot") is searched by name first. */
import type { LedgerStore } from '../../chat/local/store';
import type { Hit } from '../../chat/local/search';
import type { ProductRow } from '../../lib/types';
import type { StepProduct } from '../model';
import type { PlanStep } from './scheduler';
import { CATALOG_BY_KEY } from './catalog';

export interface PickCriteria { maxPriceInr: number | null; skinType: string | null }

export interface PickResult {
  stepId: string;
  chosen: StepProduct | null;
  /** Up to five alternatives from the same page, best rank first (the chosen one is first when present). */
  candidates: StepProduct[];
  /** Plain-words trail of how the pick was made ("top of Retinol within ₹800, skin: oily"). */
  how: string;
  /** Filters that had to be dropped to find anything. */
  relaxed: string[];
  error: string | null;
}

const MAX_CANDIDATES = 5;
/** Scope tag a step must not carry: face steps skip body-only listings and vice versa. */
const AVOID_SCOPE: Partial<Record<PlanStep['zone'], string>> = { face: 'scope:body', body: 'scope:face' };
/** Scope tag preferred (kept longest when relaxing) so a face step lands on a face-labelled listing when the page has them. */
const PREFER_SCOPE: Partial<Record<PlanStep['zone'], string>> = { face: 'scope:face', body: 'scope:body' };
/** Carrier steps (cleanse, hydrate, moisturise, protect) must not smuggle in a strong active the plan already spaces out. */
const HIDDEN_ACTIVE_TAGS = ['ing:salicylic-acid-bha', 'ing:glycolic-acid', 'ing:lactic-acid', 'ing:retinol', 'ing:benzoyl-peroxide', 'ing:azelaic-acid'];
const CARRIER_ROLES: ReadonlySet<PlanStep['role']> = new Set(['core', 'hydrate', 'protect']);
/** A tag match is only worth it while the pick keeps at least this share of the page's best score; below that the tag is
 * relaxed and reported, so "carries ceramides" never hands the step a 15-point listing. */
const SCORE_FLOOR_SHARE = 0.8;

const productOf = (row: ProductRow, category: string, of: number, siteUrl: string): StepProduct => ({
  id: row.id, category, brand: row.b, title: row.m, rank: 0, of, score: row.s, priceInr: row.p, store: row.st,
  inciStatus: row.ev, inciSourceKind: row.es ?? (row.ev === 'full' ? 'listing' : null), url: `${siteUrl}/#/c/${category}?open=${row.id}`,
});

const productOfHit = (hit: Hit, of: number | null, siteUrl: string): StepProduct => ({
  id: hit.id, category: hit.category, brand: hit.brand, title: hit.title, rank: hit.rank, of, score: hit.score, priceInr: hit.price, store: hit.store,
  inciStatus: hit.inci, inciSourceKind: hit.inciSource ?? (hit.inci === 'full' ? 'listing' : null), url: `${siteUrl}/#/c/${hit.category}?open=${hit.id}`,
});

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export async function pickForStep(step: PlanStep, criteria: PickCriteria, store: LedgerStore, siteUrl: string): Promise<PickResult> {
  const base = { stepId: step.id, candidates: [] as StepProduct[], relaxed: [] as string[], error: null as string | null };
  let missedName = '';
  if (step.query) {
    const named = await pickNamed(step, criteria, store, siteUrl);
    if (named) return named;
    missedName = `No listing named “${step.query}” on this site — `;
  }
  if (!step.category) return { ...base, chosen: null, how: 'No ranked page on this site for this step yet.' };
  let view;
  try {
    view = await store.category(step.category);
  } catch (err) {
    return { ...base, chosen: null, how: '', error: (err as Error).message };
  }
  const label = store.categoryMeta(step.category)?.label ?? step.category;
  const skinTag = criteria.skinType ? `skin:${criteria.skinType}` : null;
  const preferTag = PREFER_SCOPE[step.zone];
  const has = (t: string) => view.tagPos.has(t);
  // The step's own ingredient ("glycolic acid" for a glycolic step) is its identity and is never traded away; scope,
  // skin type and carried ingredients are preferences, relaxed from the last one back.
  const ownTags = (CATALOG_BY_KEY.get(step.key)?.tags ?? []).filter(has);
  const soft = [
    ...(preferTag && has(preferTag) ? [preferTag] : []),
    ...(skinTag && has(skinTag) ? [skinTag] : []),
    ...step.tags.filter((t) => has(t) && !ownTags.includes(t)),
  ];
  const budget = criteria.maxPriceInr;
  const avoidTag = AVOID_SCOPE[step.zone];
  const avoidPos = avoidTag && has(avoidTag) ? view.tagPos.get(avoidTag)! : null;
  const carries = (row: ProductRow, tags: string[]) => tags.every((t) => row.t.includes(view.tagPos.get(t)!));

  const hiddenPos = CARRIER_ROLES.has(step.role) ? HIDDEN_ACTIVE_TAGS.filter(has).map((t) => view.tagPos.get(t)!) : [];
  const eligible = (row: ProductRow) =>
    (budget === null || row.p <= budget) && (avoidPos === null || !row.t.includes(avoidPos)) && !hiddenPos.some((pos) => row.t.includes(pos)) && carries(row, ownTags);
  const bestPos = view.byRank.find((pos) => eligible(view.items[pos]));
  const floor = bestPos === undefined ? 0 : view.items[bestPos].s * SCORE_FLOOR_SHARE;
  let tags = soft;
  let picks: number[] = [];
  const relaxed: string[] = [];
  for (;;) {
    picks = view.byRank.filter((pos) => eligible(view.items[pos]) && (!tags.length || view.items[pos].s >= floor) && carries(view.items[pos], tags)).slice(0, MAX_CANDIDATES);
    if (picks.length || !tags.length) break;
    relaxed.push(tags[tags.length - 1]);
    tags = tags.slice(0, -1);
  }
  let ownMissing = false;
  if (!picks.length && ownTags.length) {
    // Nothing on the page carries the step's ingredient: fall back to the page top and say so plainly.
    ownMissing = true;
    picks = view.byRank.filter((pos) => (budget === null || view.items[pos].p <= budget) && (avoidPos === null || !view.items[pos].t.includes(avoidPos))).slice(0, MAX_CANDIDATES);
  }
  if (!picks.length) {
    picks = view.byRank.filter((pos) => avoidPos === null || !view.items[pos].t.includes(avoidPos)).slice(0, MAX_CANDIDATES);
    if (budget !== null) relaxed.push(`budget ${inr(budget)}`);
  }
  const candidates = picks.map((pos) => ({ ...productOf(view.items[pos], step.category!, view.items.length, siteUrl), rank: view.ranks[pos] }));
  const word = (t: string) => t.replace(/^scope:/, 'labelled for ').replace(/^skin:/, 'skin: ').replace(/^ing:/, 'with ').replace(/-/g, ' ');
  const kept = [
    budget !== null && !relaxed.includes(`budget ${inr(budget)}`) ? `within ${inr(budget)}` : '',
    ...(ownMissing ? [] : ownTags).map(word),
    ...tags.map(word),
  ].filter(Boolean);
  const droppedIng = relaxed.filter((r) => r.startsWith('ing:')).map((r) => r.slice(4).replace(/-/g, ' '));
  const how = candidates.length
    ? [
      `${missedName}#${candidates[0].rank} of ${view.items.length} in ${label}${kept.length ? ` (${kept.join(', ')})` : ''}`,
      ownMissing ? `no listing on this page carries ${ownTags.map((t) => t.slice(4).replace(/-/g, ' ')).join(' + ')}, so the page top is shown` : '',
      hiddenPos.length ? 'listings carrying a strong exfoliant, retinoid or benzoyl peroxide skipped so the actives stay on their own nights' : '',
      droppedIng.length ? `${droppedIng.join(', ')} not required: no listing carrying it scored near the page's best` : '',
    ].filter(Boolean).join('; ') + '.'
    : `Nothing in ${label} matched.`;
  return { ...base, chosen: candidates[0] ?? null, candidates, how, relaxed: relaxed.map((r) => r.replace(/^scope:/, 'labelled for ').replace(/^skin:/, 'skin type ').replace(/^ing:/, 'ingredient ').replace(/-/g, ' ')) };
}

async function pickNamed(step: PlanStep, criteria: PickCriteria, store: LedgerStore, siteUrl: string): Promise<PickResult | null> {
  const index = await store.search();
  const hits = index.search(step.query!, { limit: 25 }).filter(({ strength }) => Number.isInteger(strength)).map(({ hit }) => hit);
  if (!hits.length) return null;
  // Prefer the step's own page(s), then the best rank; the budget is honoured when any match fits it.
  const inPage = hits.filter((h) => h.category === step.category);
  const pool = inPage.length ? inPage : hits;
  const fits = criteria.maxPriceInr === null ? pool : pool.filter((h) => h.price <= criteria.maxPriceInr!);
  const ranked = (fits.length ? fits : pool).sort((a, b) => a.rank - b.rank);
  const seen = new Set<string>();
  const candidates = ranked.filter((h) => !seen.has(h.id) && seen.add(h.id)).slice(0, MAX_CANDIDATES).map((h) => productOfHit(h, store.categoryMeta(h.category)?.count ?? null, siteUrl));
  const top = candidates[0];
  return {
    stepId: step.id, chosen: top, candidates,
    how: `Named product found by search: ${top.brand} — ${top.title} (#${top.rank} of ${top.of ?? '?'} in ${store.categoryMeta(top.category)?.label ?? top.category}).`,
    relaxed: fits.length ? [] : [`budget ${inr(criteria.maxPriceInr!)}`], error: null,
  };
}
