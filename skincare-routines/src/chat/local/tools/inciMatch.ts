/** Ingredient matching for the product tools — twin of scripts/lib/inci-aliases.cjs (build) and
 * chat_api/tools/inci_match.py. Query terms go through the same normalisation as the indexed INCI columns, then
 * widen through the alias table ("iron oxide" → CI 77491/77492/77499) and are matched as whole names. */
import type { IngredientAlias } from '../../../lib/types';

export function normalizeInci(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bc\.?\s?i\.?\s*(?:no\.?)?\s*[-:.]?\s*(\d{5})\b/g, 'ci $1')
    .replace(/\(\s*and\s*\)|[,;/|\u2022\u00b7]|\s\band\b\s/g, ',')
    .replace(/[^a-z0-9,]+/g, ' ')
    .replace(/\s*,\s*/g, ',')
    .replace(/,+/g, ',')
    .replace(/^,|,$/g, '')
    .trim();
}

export interface IngredientQuery {
  /** The user's term as typed. */
  term: string;
  /** Alias-table label when the term was recognised (e.g. "Iron oxides (tint pigments)"), else null. */
  label: string | null;
  /** Names matched anywhere inside an ingredient. */
  inci: string[];
  /** Names that must be the entire ingredient ("alcohol", not "cetearyl alcohol"). */
  whole: string[];
  patterns: RegExp[];
  wholePatterns: RegExp[];
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Entries with this many INCI names or fewer are one substance under a few spellings; larger ones are groups
 * (mineral filters, retinoids) that a single INCI name must never widen into. Same constant as inci-aliases.cjs. */
const SYNONYM_ENTRY_MAX = 3;

function resolveAliasEntries(t: string, aliases: IngredientAlias[]): IngredientAlias[] {
  const own = aliases.filter((e) => e.aliases.includes(t) || e.whole.includes(t) || e.id.toLowerCase() === t);
  if (own.length) return own;
  return aliases.filter((e) => e.inci.includes(t) && e.inci.length <= SYNONYM_ENTRY_MAX);
}

export function expandIngredient(term: string, aliases: IngredientAlias[]): IngredientQuery {
  const t = normalizeInci(term);
  const inci = new Set<string>();
  const whole = new Set<string>();
  const labels: string[] = [];
  for (const entry of resolveAliasEntries(t, aliases)) {
    entry.inci.forEach((n) => inci.add(n));
    entry.whole.forEach((n) => whole.add(n));
    labels.push(entry.label);
  }
  if (t && !whole.has(t) && !labels.length) inci.add(t);
  const names = [...inci];
  const wholeNames = [...whole];
  return {
    term, label: labels[0] ?? null, inci: names, whole: wholeNames,
    patterns: names.map((n) => new RegExp(`(?:^|[ ,])${escapeRe(n)}(?:s|es)?(?:[ ,]|$)`)),
    wholePatterns: wholeNames.map((n) => new RegExp(`(?:^|,)${escapeRe(n)}(?:,|$)`)),
  };
}

/** The first name of `q` found in normalised INCI text, or null. */
export function findIngredient(text: string, q: IngredientQuery): string | null {
  for (let i = 0; i < q.patterns.length; i++) if (q.patterns[i].test(text)) return q.inci[i];
  for (let i = 0; i < q.wholePatterns.length; i++) if (q.wholePatterns[i].test(text)) return q.whole[i];
  return null;
}

/** Brand + title words, folded the same way for `title_words` constraints (prefix match per word). */
export const titleTokens = (text: string) => normalizeInci(text).replace(/,/g, ' ').split(' ').filter(Boolean);

export function titleHasWords(tokens: string[], words: string[]): boolean {
  return words.every((w) => {
    const parts = titleTokens(w);
    return parts.every((p) => tokens.some((tok) => tok === p || tok.startsWith(p)));
  });
}
