// Adapter over browser storage for the traveller's own Gemini key. The key
// never leaves this device except in the request header to Google; it is not
// in source, not in the URL, and never logged.
const KEY = 'lakshadweep-ledger:gemini-key';

export const keyStore = {
  get() {
    try {
      return localStorage.getItem(KEY) || '';
    } catch {
      return '';
    }
  },
  set(value) {
    try {
      if (value) localStorage.setItem(KEY, value.trim());
      else localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable (private mode) */
    }
  },
  has() {
    return Boolean(this.get());
  },
};

// Google keys are `AIza` + 35 URL-safe chars; anything else is a paste error.
export const looksLikeKey = (k) => /^AIza[0-9A-Za-z_-]{35}$/.test((k || '').trim());
