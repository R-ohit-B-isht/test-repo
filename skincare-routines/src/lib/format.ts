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

const SPEC_LABELS: Record<string, string> = {
  quantity: 'Quantity',
  volume: 'Volume',
  pricePer100: 'Price per 100 g/ml',
  pricePer100ml: 'Price per 100 ml',
  format: 'Format',
  keyIngredients: 'Key ingredients',
  freeFrom: 'Free from',
  dermTested: 'Dermatologically tested',
  nonComedogenic: 'Non-comedogenic',
  benefit: 'Stated benefit',
  skinBenefit: 'Stated skin benefit',
  audience: 'For',
  naturalClaim: 'Natural / ayurvedic claim',
  skinType: 'Skin type',
  rating: 'Buyer rating',
  madeIn: 'Made in',
  phBalanced: 'pH balanced',
  fragrance: 'Fragrance',
  area: 'Use area',
  concernBasis: 'Skin concern (why it matches)',
};

/** Human label for a listing spec key; unknown keys are split from camelCase. */
export const specLabel = (k: string) =>
  SPEC_LABELS[k] ?? k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
