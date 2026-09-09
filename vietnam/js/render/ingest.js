import { importPhoto } from '../journal/files.js';
import { livePhotos } from '../journal.js';

// Photo intake, mounted once per page: any `<input data-add>` (Journal, Today)
// or a `[data-dropzone]` drop hands its files here. Files are read one at a
// time (decoding a phone JPEG is heavy), progress and failures are announced
// with `journal:status` events for whichever page is listening, and the batch
// lands in the store in one write with an Undo toast (soft delete).

let store;
let busy = false;

const status = (detail) => document.dispatchEvent(new CustomEvent('journal:status', { detail }));
const toast = (detail) => document.dispatchEvent(new CustomEvent('toast', { detail }));

export async function ingest(files, dayHint = null) {
  const all = [...files];
  const isImage = (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|hei[cf])$/i.test(f.name);
  const list = all.filter(isImage);
  const errors = all.filter((f) => !isImage(f)).map((f) => `${f.name}: not a photo.`);
  if (!all.length || busy) return;
  busy = true;
  const metas = [];
  for (let i = 0; i < list.length; i += 1) {
    status({ busy: `${i + 1} of ${list.length}` });
    try {
      metas.push(await importPhoto(list[i], livePhotos(store.get()).length + metas.length, dayHint));
    } catch (e) {
      errors.push(e.message || `${list[i].name}: could not be read.`);
    }
  }
  busy = false;
  if (metas.length) {
    store.addPhotos(metas);
    const ids = new Set(metas.map((m) => m.id));
    toast({
      text: `${metas.length} photo${metas.length === 1 ? '' : 's'} added`,
      icon: 'camera',
      undo: () => store.set((s) => ({ photos: s.photos.map((p) => (ids.has(p.id) ? { ...p, deleted: true } : p)) })),
    });
  }
  const error = errors.length ? (errors.length === 1 ? errors[0] : `${errors.length} files skipped · ${errors[0]}`) : '';
  status({ busy: '', error });
  if (error && !document.querySelector('#jn-hero')) toast({ text: error, icon: 'info' });
}

const dayOf = (el) => {
  const d = el?.dataset.day ?? el?.dataset.addDay;
  return d ? Number(d) : null;
};

export function mountIngest(s) {
  store = s;
  document.addEventListener('change', (e) => {
    const input = e.target.closest('input[data-add]');
    if (!input) return;
    const files = [...input.files];
    const day = dayOf(input);
    input.value = '';
    ingest(files, day);
  });
  // Drag & drop onto a day block (or the hero) files it under that day.
  document.addEventListener('dragover', (e) => {
    const z = e.target.closest('[data-dropzone]');
    if (!z || ![...e.dataTransfer.types].includes('Files')) return;
    e.preventDefault();
    z.classList.add('is-drag');
  });
  document.addEventListener('dragleave', (e) => { e.target.closest?.('[data-dropzone]')?.classList.remove('is-drag'); });
  document.addEventListener('drop', (e) => {
    const z = e.target.closest('[data-dropzone]');
    if (!z) return;
    e.preventDefault();
    z.classList.remove('is-drag');
    ingest(e.dataTransfer.files, dayOf(z));
  });
}
