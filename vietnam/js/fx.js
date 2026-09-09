import { FX } from './data/trip.js';

// Exchange-rate adapter (Wise/Revolut's live card). One provider, no key:
// open.er-api.com publishes a daily mid-market table with CORS. A live rate is
// stored only after a real 2xx with a VND figure; nothing here invents a rate.
//   state.fxLive = { vndPerInr, usdPerInr, iso, at, src } | null
//   state.rate   = your override, ₫ per ₹ (0 = none)

const URL = 'https://open.er-api.com/v6/latest/INR';
export const SRC = 'open.er-api.com';
export const FRESH_MS = 7 * 86_400_000;
const TIMEOUT_MS = 8000;

export async function fetchLive() {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(URL, { signal: ctl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    const vnd = Number(j?.rates?.VND);
    if (j.result !== 'success' || !(vnd > 0)) throw new Error('No VND rate in reply');
    return {
      vndPerInr: Math.round(vnd * 100) / 100,
      usdPerInr: Number(j.rates?.USD) || null,
      iso: new Date((j.time_last_update_unix || Date.now() / 1000) * 1000).toISOString().slice(0, 10),
      at: Date.now(),
      src: SRC,
    };
  } finally { clearTimeout(t); }
}

export const isFresh = (live, now = Date.now()) => !!live && now - live.at < FRESH_MS;

// The rate the ledger converts with, and where it came from. Priority: yours,
// then a fresh live table, then the sourced figure the plan was built on.
export function rateInfo(state, now = Date.now()) {
  if (state.rate > 0) return { rate: state.rate, from: 'you', label: 'your rate' };
  if (isFresh(state.fxLive, now)) return { rate: state.fxLive.vndPerInr, from: 'live', label: `live ${state.fxLive.iso.slice(5).replace('-', '/')}`, iso: state.fxLive.iso };
  if (state.fxLive) return { rate: state.fxLive.vndPerInr, from: 'stale', label: `live ${state.fxLive.iso.slice(5).replace('-', '/')}, stale`, iso: state.fxLive.iso };
  return { rate: FX.vndPerInr, from: 'sourced', label: 'sourced, Sep' };
}

export const vndToInr = (vnd, rate) => Math.round(vnd / rate);
export const inrToVnd = (inr, rate) => Math.round(inr * rate);
