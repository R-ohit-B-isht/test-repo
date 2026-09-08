import { VAULT_DB } from '../config.js';

// IndexedDB adapter for document blobs (e-visa PDF, passport scan, tickets).
// Only the bytes live here, keyed by file id; names, sizes and the slot they
// belong to are in planner state. Nothing in this store ever leaves the
// browser: not in the share URL, not in the service worker cache, not in any
// request. One tiny promise wrapper so the rest of the app never sees a
// `request.onsuccess`.

const STORE = 'files';
let dbp = null;

const wrap = (req) => new Promise((ok, err) => { req.onsuccess = () => ok(req.result); req.onerror = () => err(req.error); });

const connect = (version) => {
  const req = version ? indexedDB.open(VAULT_DB, version) : indexedDB.open(VAULT_DB);
  req.onupgradeneeded = () => {
    if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: 'id' });
  };
  return Promise.race([
    wrap(req),
    new Promise((_, err) => setTimeout(() => err(new Error('File storage is busy in another tab. Close it and try again.')), 8000)),
  ]);
};

// Opens at whatever version exists; if the store is missing (an interrupted
// first upgrade leaves an empty database behind) bump the version to add it.
const open = () => {
  if (dbp) return dbp;
  if (!('indexedDB' in globalThis)) return Promise.reject(new Error('This browser cannot store files.'));
  dbp = connect().then(async (db) => {
    if (!db.objectStoreNames.contains(STORE)) {
      const v = db.version + 1;
      db.close();
      db = await connect(v);
    }
    db.onversionchange = () => { db.close(); dbp = null; };
    db.onclose = () => { dbp = null; };
    return db;
  }).catch((e) => { dbp = null; throw e; });
  return dbp;
};

const once = async (mode, run) => {
  const db = await open();
  const t = db.transaction(STORE, mode);
  const out = run(t.objectStore(STORE));
  await new Promise((ok, err) => { t.oncomplete = ok; t.onerror = () => err(t.error); t.onabort = () => err(t.error); });
  return out;
};

// A connection can be closed under us (another tab upgrading, storage
// eviction). Reopen once before giving up.
const tx = (mode, run) => once(mode, run).catch((e) => {
  if (e?.name !== 'InvalidStateError') throw e;
  dbp = null;
  return once(mode, run);
});

export const putFile = (id, blob) => tx('readwrite', (s) => { s.put({ id, blob }); });
export const getFile = async (id) => (await tx('readonly', (s) => wrap(s.get(id))))?.blob || null;
export const deleteFile = (id) => tx('readwrite', (s) => { s.delete(id); });
export const listFileIds = () => tx('readonly', (s) => wrap(s.getAllKeys()));

export const canStore = () => 'indexedDB' in globalThis;
