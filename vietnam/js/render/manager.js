import { $, $$, html } from '../dom.js';
import { icon } from '../icons.js';
import { GROUPS, slotsFor, groupSlots, recordOf, binFor } from '../vault/slots.js';
import { storeFile, appendFiles, flagFile, urlFor, releaseUrls, isImage } from '../vault/files.js';
import { slotCard } from './mgr/card.js';
import { head, groupNav, addForm } from './mgr/head.js';
import { openPeek, mountPeek } from './mgr/peek.js';
import { pasteForm, pasteResult } from './mgr/paste.js';
import { keyStore, generateJson, modelOf } from '../brain/gemini.js';
import { slotLines, PARSE_SYSTEM, parseSchema, toFill, quickParse, patchOf } from '../vault/parse.js';

// Manager page controller. Slots come from vault/slots.js, what you typed and
// dropped in is `state.vault`; this file only maps DOM events to store calls
// and paints. Text fields save on change (blur / enter), so typing never
// re-renders under your fingers.

let store = null;
let jumped = false;
let paste = { busy: false, error: '', fill: null };

const toast = (text, undo) => document.dispatchEvent(new CustomEvent('toast', { detail: { text, undo } }));
const slotOf = (el) => el.closest('[data-slot]')?.dataset.slot;
const rec = (id) => recordOf(store.get(), id);
const showErr = (card, msg) => { const p = $('.ms-err', card); p.textContent = msg; p.hidden = !msg; };

const section = (state, g) => html`
  <section class="ms-group" id="g-${g.id}" aria-labelledby="g-${g.id}-h">
    <h2 id="g-${g.id}-h" class="ms-gh">${icon(g.icon)}${g.label}<span class="num">${g.slots.length}</span></h2>
    <div class="ms-grid">${g.slots.map((s) => slotCard(state, s))}</div>
  </section>`;

// Object URLs resolve after paint: thumbnails and download links per file row.
const hydrate = (root, state) => {
  const metas = Object.values(state.vault).flatMap((r) => r.files || []);
  $$('[data-fid]', root).forEach(async (li) => {
    const meta = metas.find((m) => m.id === li.dataset.fid);
    const url = meta && await urlFor(meta);
    if (!url) { li.dataset.missing = 'true'; return; }
    if (isImage(meta)) $('img', li).src = url;
    $('[data-dl]', li).href = url;
  });
};

async function addFiles(id, list, replaceId = null) {
  const card = $(`#slot-${CSS.escape(id)}`);
  showErr(card, '');
  card.dataset.busy = 'true';
  try {
    const metas = [];
    for (const f of list) metas.push(await storeFile(f));
    store.setVault(id, appendFiles(replaceId ? flagFile(rec(id), replaceId, true) : rec(id), metas));
    toast(replaceId ? 'File replaced' : `${metas.length} file${metas.length > 1 ? 's' : ''} kept on this device`);
  } catch (e) {
    showErr(card, e.message || 'Could not keep that file.');
  } finally {
    if (card.isConnected) card.dataset.busy = 'false';
  }
}

const removeFile = (id, fid) => {
  store.setVault(id, flagFile(rec(id), fid, true));
  toast('File removed', () => store.setVault(id, flagFile(rec(id), fid, false)));
};

const removeSlot = (id) => {
  const title = slotsFor(store.get()).find((s) => s.id === id)?.title || 'Slot';
  store.setVault(id, { deleted: true, deletedAt: Date.now() });
  toast(`${title} removed`, () => store.setVault(id, { deleted: false }));
};

const addSlot = (form) => {
  const f = new FormData(form);
  const title = String(f.get('title')).trim();
  if (!title) return;
  const group = GROUPS.some((g) => g.id === f.get('group')) ? f.get('group') : 'stuff';
  const id = `my-${Date.now().toString(36)}`;
  store.addSlot({ id, title, group, icon: GROUPS.find((g) => g.id === group).icon, hint: 'Added by you' });
  form.reset();
  requestAnimationFrame(() => $(`#slot-${id} input[type=text]`)?.focus());
};

const onChange = (e) => {
  const t = e.target; const id = slotOf(t);
  if (!id) return;
  if (t.name?.startsWith('stage-')) return store.setVault(id, { status: t.value });
  if (t.dataset.field) return store.setVault(id, { [t.dataset.field]: t.value.trim() });
  if ('upload' in t.dataset && t.files.length) return addFiles(id, [...t.files]);
  if (t.dataset.replace && t.files.length) return addFiles(id, [t.files[0]], t.dataset.replace);
  return undefined;
};

const onClick = (e) => {
  const t = e.target; const id = slotOf(t);
  const peek = t.closest('[data-peek]');
  if (peek) { const meta = rec(id).files.find((f) => f.id === peek.dataset.peek); return meta && openPeek(meta); }
  const rm = t.closest('[data-rmfile]'); if (rm) return removeFile(id, rm.dataset.rmfile);
  const ds = t.closest('[data-drop-slot]'); if (ds) return removeSlot(ds.dataset.dropSlot);
  const dl = t.closest('[data-dl]'); if (dl && dl.getAttribute('href') === '#') e.preventDefault();
  return undefined;
};

// ---- Paste a confirmation ---------------------------------------------------

const paintPaste = () => {
  const host = $('#mgr-paste');
  if (!host) return;
  const text = $('textarea', host)?.value || '';
  host.innerHTML = html`${pasteForm(paste, !!keyStore.get())}${paste.fill ? pasteResult(paste.fill, slotsFor(store.get())) : ''}`;
  const ta = $('textarea', host);
  if (ta) ta.value = text;
};

async function readPaste(text) {
  const slots = slotsFor(store.get());
  paste = { busy: true, error: '', fill: null };
  paintPaste();
  try {
    const key = keyStore.get();
    if (key) {
      const reply = await generateJson({
        key, model: modelOf(), system: PARSE_SYSTEM, schema: parseSchema(slots.map((s) => s.id)),
        user: `SLOTS (id | title | group | date | till | dateField | hint):\n${slotLines(slots)}\n\nTEXT:\n${text.slice(0, 12000)}`,
      });
      paste = { busy: false, error: '', fill: toFill(reply, slots, 'gemini') };
    } else {
      paste = { busy: false, error: '', fill: quickParse(text, slots) };
    }
  } catch (e) {
    paste = { busy: false, error: e.message || String(e), fill: null };
  }
  paintPaste();
  $('.ms-pres, .ms-err:not([hidden])', $('#mgr-paste'))?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

const fillSlot = () => {
  const f = paste.fill;
  const slot = f && slotsFor(store.get()).find((s) => s.id === f.slot);
  if (!slot) return;
  const before = rec(slot.id);
  store.setVault(slot.id, patchOf(f, slot, before));
  paste = { busy: false, error: '', fill: null };
  const ta = $('#mgr-paste textarea');
  if (ta) ta.value = '';
  paintPaste();
  toast(`${slot.title} filled${f.ref ? ` · ${f.ref}` : ''}`, () => store.setVault(slot.id, { ref: before.ref, note: before.note, date: before.date, status: before.status }));
  requestAnimationFrame(() => {
    const card = $(`#slot-${CSS.escape(slot.id)}`);
    card?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    card?.classList.add('is-hit');
  });
};

const onPasteClick = (e) => {
  if (e.target.closest('[data-fill-drop]')) { paste = { busy: false, error: '', fill: null }; return paintPaste(); }
  if (e.target.closest('[data-fill-go]')) return fillSlot();
  return undefined;
};

const onPasteChange = (e) => {
  if (e.target.matches('[data-fill-slot]') && paste.fill) {
    paste.fill = { ...paste.fill, slot: e.target.value };
    $('[data-fill-go]', $('#mgr-paste')).disabled = !paste.fill.slot;
    $('[data-fill-go]', $('#mgr-paste')).innerHTML = html`${icon('check')} Fill ${slotsFor(store.get()).find((s) => s.id === paste.fill.slot)?.title || 'slot'}`;
  }
};

const onDrop = (e) => {
  const card = e.target.closest('.mslot');
  if (!card) return;
  e.preventDefault();
  card.classList.remove('is-over');
  if (e.dataTransfer?.files.length) addFiles(card.dataset.slot, [...e.dataTransfer.files]);
};

export function mountManager(s) {
  store = s;
  const root = $('#manager');
  if (!root) return;
  mountPeek();
  root.addEventListener('change', onChange);
  root.addEventListener('click', onClick);
  root.addEventListener('submit', (e) => {
    if (e.target.id === 'mgr-add') { e.preventDefault(); addSlot(e.target); }
    if (e.target.id === 'mgr-paste-form') { e.preventDefault(); const text = new FormData(e.target).get('text').trim(); if (text && !paste.busy) readPaste(text); }
  });
  const ph = $('#mgr-paste');
  if (ph) {
    ph.addEventListener('click', onPasteClick);
    ph.addEventListener('change', onPasteChange);
    document.addEventListener('paste:read', (e) => { paintPaste(); const ta = $('textarea', ph); ta.value = e.detail; readPaste(e.detail); });
    document.addEventListener('gemini:key', paintPaste);
    paintPaste();
  }
  root.addEventListener('dragover', (e) => { const c = e.target.closest('.mslot'); if (c) { e.preventDefault(); c.classList.add('is-over'); } });
  root.addEventListener('dragleave', (e) => e.target.closest('.mslot')?.classList.remove('is-over'));
  root.addEventListener('drop', onDrop);
  root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input[data-field]')) e.target.blur(); });
}

export function renderManager(state) {
  const root = $('#manager');
  if (!root) return;
  const focus = document.activeElement?.closest?.('#manager') ? document.activeElement : null;
  const refocus = focus?.name ? `[name="${focus.name}"][value="${focus.value}"]` : null;
  releaseUrls();
  const slots = slotsFor(state);
  const groups = groupSlots(slots);
  $('#mgr-head').innerHTML = head(state, slots);
  $('#mgr-nav').innerHTML = groupNav(groups);
  $('#mgr-groups').innerHTML = html`${groups.map((g) => section(state, g))}${addForm()}`;
  $('#mgr-bin').textContent = binFor(state).length ? `${binFor(state).length} removed slot${binFor(state).length > 1 ? 's' : ''} kept for undo.` : '';
  hydrate(root, state);
  if (refocus) $(refocus, root)?.focus();
  if (!jumped && location.hash.startsWith('#slot-')) { jumped = true; requestAnimationFrame(() => { const c = $(location.hash); c?.scrollIntoView({ block: 'center' }); c?.classList.add('is-hit'); }); }
}
