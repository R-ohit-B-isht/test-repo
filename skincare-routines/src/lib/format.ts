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

export const STORE_LABEL: Record<string, string> = { flipkart: 'Flipkart', amazon: 'Amazon.in', Flipkart: 'Flipkart', Amazon: 'Amazon.in' };
export const storeLabel = (s: string) => STORE_LABEL[s] ?? s;

export function usePrefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
