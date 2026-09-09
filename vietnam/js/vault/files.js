import { VAULT_MAX_MB } from '../config.js';
import { putFile, getFile, canStore } from './db.js';

// Service layer between the Manager UI and the two stores: the blob goes to
// IndexedDB, the description (name, type, size, when) goes to planner state.
// Removing a file only flags the description — the bytes stay for undo.

const OK_TYPES = /^(application\/pdf|image\/(jpeg|png|webp|heic|heif|gif))$/;
const MAX = VAULT_MAX_MB * 1024 * 1024;

export const fileId = () => `f-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const isImage = (f) => f.type.startsWith('image/');
export const fmtBytes = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export const checkFile = (file) => {
  if (!canStore()) return 'This browser cannot keep files offline.';
  if (!OK_TYPES.test(file.type)) return 'PDF or photo (JPG, PNG, WebP, HEIC) only.';
  if (file.size > MAX) return `Over ${VAULT_MAX_MB} MB. Compress or export a smaller PDF.`;
  return null;
};

// → metadata record for state.vault[slot].files, or throws with a readable message.
export async function storeFile(file) {
  const bad = checkFile(file);
  if (bad) throw new Error(bad);
  const id = fileId();
  await putFile(id, file);
  return { id, name: file.name, type: file.type, size: file.size, added: Date.now() };
}

export const withFiles = (rec, fn) => ({ files: fn(rec.files) });
export const appendFiles = (rec, metas) => withFiles(rec, (f) => [...f, ...metas]);
export const flagFile = (rec, id, deleted) => withFiles(rec, (f) => f.map((x) => (x.id === id ? { ...x, deleted, deletedAt: deleted ? Date.now() : undefined } : x)));

// Object URLs for previews / downloads, released when the card re-renders.
const urls = new Map();
export async function urlFor(meta) {
  if (urls.has(meta.id)) return urls.get(meta.id);
  const blob = await getFile(meta.id);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urls.set(meta.id, url);
  return url;
}
export const releaseUrls = () => { urls.forEach((u) => URL.revokeObjectURL(u)); urls.clear(); };
