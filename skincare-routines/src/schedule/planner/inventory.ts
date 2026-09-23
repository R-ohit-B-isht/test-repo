/** Turns the words a person types ("face wash cleanser exfoliator … urea 20% Kojic acid") into catalog items. Phrase
 * aliases are matched longest-first and consumed; leftover tokens get one edit-distance pass against alias words so
 * common misspellings ("essense", "allatonin") still land; anything else is reported as unknown — never guessed. */
import { CATALOG, CATALOG_BY_KEY, FILLER_WORDS, type CatalogItem } from './catalog';

export interface InventoryItem {
  key: string;
  /** Days per week the person wants (actives / treat items); core items are always 7. */
  days: number;
  /** The text that matched, for the chip ("essense" → Essence). */
  matched: string;
}

export interface Inventory {
  items: InventoryItem[];
  unknown: string[];
}

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9+%'\s-]/g, ' ').replace(/\s+/g, ' ').trim();

const ALIASES: { alias: string; item: CatalogItem }[] = CATALOG
  .flatMap((item) => item.aliases.map((alias) => ({ alias: norm(alias), item })))
  .sort((a, b) => b.alias.length - a.alias.length);

const ALIAS_WORDS: { word: string; item: CatalogItem }[] = ALIASES
  .filter(({ alias }) => !alias.includes(' ') && alias.length >= 5)
  .map(({ alias, item }) => ({ word: alias, item }));

function editDistance(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

const fuzzy = (token: string): CatalogItem | null => {
  if (token.length < 5) return null;
  let best: { d: number; item: CatalogItem } | null = null;
  for (const { word, item } of ALIAS_WORDS) {
    const d = editDistance(token, word);
    if (d <= (token.length >= 8 ? 2 : 1) && (!best || d < best.d)) best = { d, item };
  }
  return best?.item ?? null;
};

/** Per-item "3x", "3 nights", "twice" hints right after the word, e.g. "retinol 3x", "glycolic twice a week". */
const FREQ = /^(?:(\d)\s*(?:x|times?|nights?|days?)|(once|twice|thrice))(?:\s*(?:a|per)\s*week)?/;
const WORD_FREQ: Record<string, number> = { once: 1, twice: 2, thrice: 3 };

export function parseInventory(text: string): Inventory {
  let rest = ` ${norm(text)} `;
  const found = new Map<string, InventoryItem>();
  for (const { alias, item } of ALIASES) {
    const needle = ` ${alias} `;
    let at = rest.indexOf(needle);
    while (at !== -1) {
      const after = rest.slice(at + needle.length);
      const freq = FREQ.exec(after);
      let days = item.days;
      let consumed = needle.length;
      if (freq) {
        days = Math.min(7, Math.max(1, freq[1] ? Number(freq[1]) : WORD_FREQ[freq[2]] ?? item.days));
        consumed += freq[0].length;
      }
      if (!found.has(item.key)) found.set(item.key, { key: item.key, days: item.role === 'core' || item.role === 'protect' ? 7 : days, matched: alias });
      rest = `${rest.slice(0, at)} ${rest.slice(at + consumed)}`;
      at = rest.indexOf(needle);
    }
  }
  const unknown: string[] = [];
  for (const token of rest.split(' ').filter(Boolean)) {
    if (FILLER_WORDS.has(token) || /^[\d%+-]+$/.test(token)) continue;
    const item = fuzzy(token);
    if (item) { if (!found.has(item.key)) found.set(item.key, { key: item.key, days: item.days, matched: token }); }
    else if (!unknown.includes(token)) unknown.push(token);
  }
  const order = new Map(CATALOG.map((c, i) => [c.key, i]));
  return { items: [...found.values()].sort((a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0)), unknown };
}

export const catalogItem = (key: string): CatalogItem => {
  const item = CATALOG_BY_KEY.get(key);
  if (!item) throw new Error(`Unknown routine item '${key}'`);
  return item;
};
