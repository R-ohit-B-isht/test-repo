const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export const rupees = (n: number) => `₹${inr.format(n)}`;
export const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

export function verdict(score: number): string {
  if (score >= 75) return 'Excellent';
  if (score >= 65) return 'Strong';
  if (score >= 55) return 'Good';
  if (score >= 45) return 'Average';
  return 'Weak';
}

/** Booking / IMDb-style solid badge band: colour follows the same thresholds as the verdict words. */
export function scoreBand(score: number): 'good' | 'ok' | 'meh' | 'low' {
  if (score >= 65) return 'good';
  if (score >= 55) return 'ok';
  if (score >= 45) return 'meh';
  return 'low';
}
export const scoreClass = (score: number, size?: 'lg') => `score score-${scoreBand(score)}${size === 'lg' ? ' score-lg' : ''}`;

export const STORE_LABEL: Record<string, string> = { flipkart: 'Flipkart', amazon: 'Amazon.in', Flipkart: 'Flipkart', Amazon: 'Amazon.in' };
export const storeLabel = (s: string) => STORE_LABEL[s] ?? s;

export function usePrefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Marketplace spec-table keys are already the seller's own labels; camelCase keys from Amazon captures are split. */
export const specLabel = (k: string) => (/[a-z][A-Z]/.test(k) ? k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase()) : k);

/** Group facet defs are keyed `${category}/${group}` in the manifest; the category page resolves them once. */
export function groupsFor<T>(all: Record<string, T>, category: string): Record<string, T> {
  const out: Record<string, T> = {};
  const prefix = `${category}/`;
  for (const [k, v] of Object.entries(all)) if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
  return out;
}
