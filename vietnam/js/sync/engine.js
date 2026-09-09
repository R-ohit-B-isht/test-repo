import { SYNC_URL, SYNC_DOC_SLOT, SYNC_POLL_MS, SYNC_PUSH_DEBOUNCE_MS } from '../config.js';
import { flatten, diff, applyFields, cleanCode, CODE_RE } from '../sync.js';
import { createClient, SyncError } from './client.js';

// Room sync engine (F16). Singleton per page; the store is the only thing it
// writes to. Cycle: local change → debounce → push the diff since the last
// agreed document → server merges (last writer wins) → the merged document
// comes back → apply → that document becomes the new base. Between changes it
// polls with If-None-Match so an unchanged room costs one 304 every 6 s, only
// while the tab is visible and online.
//
// Status (observer pattern, `sync:status` on document):
//   { room, phase: 'off' | 'idle' | 'busy' | 'error', at, error, pulled }

const now = () => Date.now();

const loadBase = () => {
  try { return JSON.parse(localStorage.getItem(SYNC_DOC_SLOT) || 'null') || { version: 0, f: {} }; } catch { return { version: 0, f: {} }; }
};
const saveBase = (b) => localStorage.setItem(SYNC_DOC_SLOT, JSON.stringify(b));

export function createSync(store) {
  let client = null;
  try { client = createClient(SYNC_URL); } catch { client = null; }
  let base = loadBase();
  let status = { room: store.get().sync?.room || null, phase: 'off', at: null, error: '', pulled: 0 };
  let timer = 0;
  let poll = 0;
  let inflight = null;
  let applying = false;

  const emit = (patch) => {
    status = { ...status, ...patch };
    document.dispatchEvent(new CustomEvent('sync:status', { detail: status }));
  };
  const room = () => store.get().sync?.room || null;
  const configured = () => !!client;

  // Fold a server document into state and remember it as the new base.
  const absorb = (doc) => {
    const s = store.get();
    const local = flatten(s);
    const pulled = Object.keys(doc.f).filter((k) => JSON.stringify(doc.f[k][0]) !== JSON.stringify(local[k] ?? null)).length;
    base = { version: doc.version, f: doc.f };
    saveBase(base);
    if (pulled) {
      applying = true;
      try { store.set(applyFields(s, doc.f)); } finally { applying = false; }
    }
    return pulled;
  };

  const fail = (e) => {
    const err = e instanceof SyncError ? e : new SyncError('server', 'Sync failed.');
    if (err.code === 'not_found') leave(true);
    emit({ phase: err.code === 'offline' ? 'idle' : 'error', error: err.message });
  };

  // One round trip: push what changed (or just read when nothing did).
  const tick = async () => {
    const code = room();
    if (!code || !client || inflight) return inflight;
    base = loadBase();
    const changes = diff(base.f, flatten(store.get()), now());
    emit({ phase: 'busy', error: '' });
    inflight = (async () => {
      try {
        const doc = Object.keys(changes).length ? await client.push(code, changes) : await client.read(code, base.version);
        const pulled = doc ? absorb(doc) : 0;
        emit({ phase: 'idle', at: now(), error: '', pulled });
        if (pulled > 0 && !document.querySelector('#sync-card')) {
          document.dispatchEvent(new CustomEvent('toast', { detail: { text: `${pulled} change${pulled === 1 ? '' : 's'} from your room`, icon: 'people' } }));
        }
      } catch (e) {
        fail(e);
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(tick, SYNC_PUSH_DEBOUNCE_MS);
  };

  const startPolling = () => {
    clearInterval(poll);
    poll = setInterval(() => { if (document.visibilityState === 'visible' && navigator.onLine) tick(); }, SYNC_POLL_MS);
  };
  const stopPolling = () => { clearInterval(poll); poll = 0; };

  function leave(expired = false) {
    stopPolling();
    clearTimeout(timer);
    base = { version: 0, f: {} };
    localStorage.removeItem(SYNC_DOC_SLOT);
    applying = true;
    try { store.set({ sync: null }); } finally { applying = false; }
    emit({ room: null, phase: 'off', at: null, error: expired ? 'That room is gone — it may have expired.' : '', pulled: 0 });
  }

  // Join: read the room, merge it with what is here (both survive — a friend's
  // expenses join yours, the newer pick wins), then push our side.
  async function join(rawCode) {
    if (!client) throw new SyncError('base', 'No sync server is set.');
    const code = cleanCode(rawCode);
    emit({ phase: 'busy', error: '' });
    try {
      if (!CODE_RE.test(code)) throw new SyncError('bad_code', 'Room codes are 6 letters or digits, like RCZ 5SS.');
      const doc = await client.read(code, 0);
      base = { version: 0, f: {} };
      applying = true;
      try { store.set({ sync: { room: code, joined: now() } }); } finally { applying = false; }
      const pulled = absorb(doc);
      emit({ room: code, phase: 'idle', at: now(), error: '', pulled });
      startPolling();
      await tick();
      return { room: code, pulled };
    } catch (e) {
      fail(e);
      throw e;
    }
  }

  async function open() {
    if (!client) throw new SyncError('base', 'No sync server is set.');
    emit({ phase: 'busy', error: '' });
    try {
      const doc = await client.open();
      return await join(doc.room);
    } catch (e) {
      fail(e);
      throw e;
    }
  }

  store.subscribe(() => {
    if (applying || !room() || !client) return;
    schedule();
  });
  addEventListener('online', () => { if (room()) tick(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && room()) tick(); });

  if (room() && client) {
    emit({ phase: 'idle' });
    startPolling();
    tick();
  } else if (room() && !client) {
    emit({ phase: 'error', error: 'No sync server is set on this device.' });
  }

  return { join, open, leave, tick, status: () => status, configured };
}
