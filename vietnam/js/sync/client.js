import { roomUrl } from '../sync.js';

// HTTP adapter for the sync service (../vietnam-sync). Every call resolves to
// a plain outcome; a thrown SyncError carries a stable `code` the engine and
// the card can act on: offline, not_found, bad_code, too_big, server, base.

export class SyncError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const TIMEOUT_MS = 9000;

const call = async (url, init = {}) => {
  if (!navigator.onLine) throw new SyncError('offline', 'You are offline.');
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, { ...init, signal: ctl.signal, cache: 'no-store' });
  } catch {
    throw new SyncError('server', 'Could not reach the sync server.');
  } finally {
    clearTimeout(t);
  }
  if (res.status === 304) return null;
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error page */ }
  if (!res.ok) {
    const d = body?.detail;
    throw new SyncError(d?.code || 'server', d?.message || `Sync server said ${res.status}.`);
  }
  return body;
};

export const createClient = (base) => {
  if (!base) throw new SyncError('base', 'No sync server is set.');
  return {
    open: () => call(`${base.replace(/\/+$/, '')}/rooms`, { method: 'POST' }),
    read: (code, version) => call(roomUrl(base, code), { headers: version ? { 'If-None-Match': `"${version}"` } : {} }),
    push: (code, f) => call(roomUrl(base, code), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ f }) }),
  };
};
