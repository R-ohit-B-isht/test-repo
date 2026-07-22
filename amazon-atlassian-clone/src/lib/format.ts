export function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

/** Splits a price into whole + fractional parts so the hero can weight them (ADS unit-vs-number). */
export function splitPrice(value: number): { whole: string; frac: string } {
  const [whole, frac = '00'] = value.toFixed(2).split('.')
  const withCommas = Number(whole).toLocaleString('en-US')
  return { whole: withCommas, frac }
}
