import type { Manifest } from '../lib/types';
import type { PageContext } from './types';

export interface Suggestion { text: string; kicker: string }

/** Prompt suggestions are composed from the live manifest and the current page — never from a fixed list of products. */
export function suggestionsFor(manifest: Manifest | null, page: PageContext): Suggestion[] {
  const out: Suggestion[] = [];
  const cat = page.category;
  if (page.product) {
    out.push({ kicker: 'This listing', text: `Why is ${page.product.brand} ${shorten(page.product.title)} ranked #${page.product.rank}?` });
    out.push({ kicker: 'This listing', text: `Where does the INCI for ${page.product.brand} ${shorten(page.product.title)} come from?` });
  }
  if (page.compare && page.compare.length >= 2) out.push({ kicker: 'Compare tray', text: 'Compare the products in my compare tray on formula and safety.' });
  if (cat) {
    out.push({ kicker: cat.label, text: `What are the top 5 ${cat.label.toLowerCase()} products with a verified full INCI list?` });
    if (page.filters?.length) out.push({ kicker: cat.label, text: `Explain what my current filters (${page.filters.join(', ')}) do to this ranking.` });
    out.push({ kicker: cat.label, text: `What is the reference ceiling for ${cat.label.toLowerCase()} and is it sold on Flipkart or Amazon.in?` });
  }
  if (manifest?.knowledge) {
    const hair = cat?.zone === 'hair';
    out.push(hair
      ? { kicker: 'Ingredients', text: 'Does oiling my hair before blow-drying protect it from heat?' }
      : { kicker: 'Ingredients', text: 'Can I use retinol and BHA together?' });
  }
  if (manifest) {
    const total = manifest.total.toLocaleString('en-IN');
    if (!cat) {
      const pick = manifest.categories.slice().sort((a, b) => b.count - a.count).slice(0, 3);
      for (const c of pick) out.push({ kicker: c.label, text: `Which ${c.label.toLowerCase()} products score highest on verified ingredients?` });
      out.push({ kicker: 'Whole site', text: `How are the ${total} listings across ${manifest.categories.length} categories scored?` });
    }
    out.push({ kicker: 'Method', text: 'Why do seller claims like "paraben-free" count for zero?' });
  }
  return out.slice(0, 6);
}

const shorten = (title: string) => title.split(/\s+/).slice(0, 5).join(' ');
