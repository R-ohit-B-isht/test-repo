import { $, inr } from '../../dom.js';
import { storeFile } from '../../vault/files.js';
import { livePeople, liveExpenses, newId, nextHue, personOf } from '../../split/model.js';
import { readExpense, readSettle } from './form.js';
import { openSheet, closeSheet } from './sheet.js';

// Store-changing actions for the Split page. Each one validates, writes
// through the store and moves the sheet to the right face.

const toast = (text, undo) => document.dispatchEvent(new CustomEvent('toast', { detail: { text, undo } }));
const showErr = (form, msg) => { const p = $('.ms-err', form); if (p) { p.textContent = msg; p.hidden = !msg; } };

export async function saveExpense(store, form) {
  const state = store.get();
  const { data, error } = readExpense(form, state);
  if (error) return showErr(form, error);
  const file = $('input[name=receipt]', form).files[0];
  let receipt;
  if (file) {
    try { receipt = await storeFile(file); } catch (e) { return showErr(form, e.message || 'Could not keep that file.'); }
  }
  if (form.dataset.id) {
    store.setExpense(form.dataset.id, receipt ? { ...data, receipt } : data);
    return openSheet(store.get(), { mode: 'x', id: form.dataset.id });
  }
  const id = newId('x');
  store.addExpense({ id, ...data, receipt: receipt || null, created: Date.now(), updated: Date.now() });
  toast(`${inr(data.inr)} logged`);
  return openSheet(store.get(), { mode: 'x', id });
}

export const saveSettle = (store, form) => {
  const { data, error } = readSettle(form);
  if (error) return showErr(form, error);
  const id = newId('x');
  store.addExpense({ id, ...data, receipt: null, created: Date.now(), updated: Date.now() });
  toast(`${inr(data.inr)} payment recorded`);
  return openSheet(store.get(), { mode: 'x', id });
};

export const removeExpense = (store, id) => {
  store.setExpense(id, { deleted: true, deletedAt: Date.now() });
  closeSheet();
  toast('Row removed', () => store.setExpense(id, { deleted: false }));
};

export const removePerson = (store, id) => {
  const p = personOf(store.get(), id);
  if (!p) return;
  const used = liveExpenses(store.get()).some((x) => x.by === id || x.to === id || id in (x.split?.parts || {}));
  if (used) { toast(`${p.name} is on a row. Remove those first.`); return; }
  store.setPerson(id, { deleted: true, deletedAt: Date.now() });
  closeSheet();
  toast(`${p.name} removed`, () => store.setPerson(id, { deleted: false }));
};

export const savePerson = (store, form) => {
  const name = String(new FormData(form).get('name')).trim().slice(0, 24);
  if (!name) return;
  store.setPerson(form.dataset.id, { name });
  openSheet(store.get(), { mode: 'person', id: form.dataset.id });
};

export const addPerson = (store, name, isMe) => {
  const clean = String(name || '').trim().slice(0, 24);
  if (!clean) return null;
  const state = store.get();
  if (livePeople(state).some((p) => p.name.toLowerCase() === clean.toLowerCase())) { toast(`${clean} is already here`); return null; }
  const id = newId('p');
  store.addPerson({ id, name: clean, hue: nextHue(state), me: !!isMe, created: Date.now() });
  return id;
};

export const claimMe = (store, id) => {
  store.setMe(id);
  toast('Saved. This browser knows you now.');
};
