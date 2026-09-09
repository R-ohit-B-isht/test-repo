import { $, $$, html } from '../dom.js';
import { lookup, isExtra, catalogOf } from '../data/activities.js';
import { keyStore, generateJson, modelOf } from '../brain/gemini.js';
import { parseLink, fetchEmbed, LINK_SYSTEM, linkSchema, linkPrompt, quickGuess, toGuess, picsFor, toPick, STOP_NAME } from '../brain/link.js';
import { mountGalleries } from './gallery.js';
import { impForm, impReview, impSaved } from './imp/view.js';

// "Saw it on Insta?" card at the top of the picker: paste a YouTube / TikTok /
// Instagram link → the clip's title (oEmbed) + your caption → Gemini (or a word
// match) names the place → Commons photos of it → you review → one tap adds
// the pick. Nothing is saved until you tap Add; the links you did save sit
// below the card so you can find or drop them again.

const IDLE = { busy: '', error: '', need: false, link: null, embed: null, caption: '', guess: null, pics: [], via: '' };
let ui = { ...IDLE };
let store;
let ctrl;

const toast = (text, undo) => document.dispatchEvent(new CustomEvent('toast', { detail: { text, undo } }));
const uid = () => `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const host = () => $('#picker-import');

const paint = () => {
  const h = host();
  if (!h) return;
  const url = $('input[name="url"]', h)?.value || '';
  const cap = $('textarea[name="caption"]', h)?.value ?? ui.caption;
  h.innerHTML = html`${impForm(ui, !!keyStore.get())}${ui.guess ? impReview(ui, store.get()) : ''}${impSaved(store.get())}`;
  const u = $('input[name="url"]', h);
  if (u && url) u.value = url;
  const t = $('textarea[name="caption"]', h);
  if (t && cap) t.value = cap;
};

const fail = (e) => { ui = { ...ui, busy: '', error: e?.name === 'AbortError' ? '' : e?.message || String(e) }; };

async function readLink(url, caption) {
  ctrl?.abort();
  ctrl = new AbortController();
  const { signal } = ctrl;
  const link = parseLink(url);
  if (!link) { ui = { ...IDLE, caption, error: 'That is not a link we can open — paste the full https:// address.' }; return paint(); }
  ui = { ...IDLE, link, caption, busy: 'Reading the clip…' };
  paint();
  try {
    let embed = null;
    try { embed = await fetchEmbed(link, signal); } catch (e) { if (!caption) throw e; }
    if (!embed?.title && !caption) {
      ui = { ...ui, busy: '', need: true, embed };
      paint();
      $('textarea[name="caption"]', host())?.focus();
      return undefined;
    }
    ui = { ...ui, embed, busy: 'Naming the place…' };
    paint();
    const key = keyStore.get();
    const state = store.get();
    let guess;
    if (key) {
      const reply = await generateJson({ key, model: modelOf(), system: LINK_SYSTEM, schema: linkSchema(catalogOf(state).map((x) => x.id)), user: linkPrompt(link, embed, caption, state), signal });
      guess = toGuess(reply, state);
      ui.via = 'gemini';
    } else {
      guess = quickGuess(link, embed, caption, state);
      ui.via = 'words';
    }
    ui = { ...ui, guess, busy: 'Finding photos…' };
    paint();
    let pics = [];
    try { pics = await picsFor(guess, signal); } catch { pics = []; }
    if (signal.aborted) return undefined;
    ui = { ...ui, pics, busy: '' };
  } catch (e) {
    fail(e);
  }
  paint();
  $('.imp-res, .imp-err:not([hidden])', host())?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  return undefined;
}

// The review form is the source of truth for what gets added.
const guessFromForm = () => {
  const box = $('.imp-res', host());
  const v = (n) => $(`[name="${n}"]`, box)?.value ?? '';
  const inr = v('inr').trim();
  return toGuess({
    ...ui.guess,
    name: v('name'), stop: v('stop'), slot: v('slot'), hours: Number(v('hours')), inr: inr === '' ? null : Number(inr),
    kind: $('input[name="kind"]:checked', box)?.value, note: v('note'),
  }, store.get());
};

const flash = (id) => {
  const x = lookup(store.get(), id);
  if (!x) return;
  if (!isExtra(x)) document.dispatchEvent(new CustomEvent('picker:show', { detail: x.stop }));
  requestAnimationFrame(() => {
    const tile = $(`[data-pick="${CSS.escape(id)}"]`)?.closest('.tile');
    tile?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    tile?.classList.add('is-new');
  });
};

const addPick = () => {
  const g = guessFromForm();
  if (!g.name || !g.stop) return;
  const pick = toPick(g, ui.link, ui.embed, ui.pics);
  const state = store.get();
  const clash = lookup(state, pick.id);
  if (clash && !clash.est) { ui = { ...ui, error: `${clash.name} is already in the catalog — switch it on instead.` }; return paint(); }
  const rec = { id: uid(), url: ui.link.url, provider: ui.link.provider, act: pick.id, created: Date.now() };
  store.addCustom(pick);
  store.addImport(rec);
  ui = { ...IDLE };
  paint();
  toast(`${pick.name} added · ${STOP_NAME[pick.stop]}`, () => { store.dropCustom(pick.id); store.setImport(rec.id, { deleted: true }); });
  flash(pick.id);
  return undefined;
};

const switchOn = (id) => {
  const state = store.get();
  const x = lookup(state, id);
  if (!x) return;
  if (!state.picks[id]) {
    store.togglePick(id);
    store.addImport({ id: uid(), url: ui.link.url, provider: ui.link.provider, act: id, created: Date.now() });
    toast(`${x.name} switched on`, () => store.togglePick(id));
  }
  ui = { ...IDLE };
  paint();
  flash(id);
};

const forget = (rid) => {
  const rec = (store.get().imports || []).find((r) => r.id === rid);
  if (!rec) return;
  const x = lookup(store.get(), rec.act);
  const own = x?.est && x.link === rec.url;
  store.setImport(rid, { deleted: true });
  if (own) store.dropCustom(x.id);
  toast(own ? `${x.name} removed` : 'Link forgotten', () => { store.setImport(rid, { deleted: false }); if (own) store.addCustom(x); });
};

const onClick = (e) => {
  if (e.target.closest('[data-imp-drop]')) { ctrl?.abort(); ui = { ...IDLE, caption: ui.caption }; return paint(); }
  if (e.target.closest('[data-imp-add]')) return addPick();
  const on = e.target.closest('[data-imp-on]');
  if (on) return switchOn(on.dataset.impOn);
  const show = e.target.closest('[data-imp-show]');
  if (show) return flash(show.dataset.impShow);
  const rm = e.target.closest('[data-imp-rm]');
  if (rm) return forget(rm.dataset.impRm);
  return undefined;
};

const onInput = (e) => {
  const box = e.target.closest('.imp-res');
  if (!box || !ui.guess) return;
  const g = guessFromForm();
  $('[data-imp-add]', box).disabled = !(g.name && g.stop);
};

export function mountImporter(s) {
  store = s;
  const h = host();
  if (!h) return;
  h.addEventListener('submit', (e) => {
    if (e.target.id !== 'imp-form') return;
    e.preventDefault();
    const fd = new FormData(e.target);
    const url = String(fd.get('url') || '').trim();
    const caption = String(fd.get('caption') || '').trim();
    if (url && !ui.busy) readLink(url, caption);
  });
  h.addEventListener('click', onClick);
  h.addEventListener('input', onInput);
  h.addEventListener('change', onInput);
  mountGalleries(h);
  document.addEventListener('gemini:key', paint);
  // Dev fixtures: { url, caption } — read straight away, saved only if you tap Add.
  document.addEventListener('link:read', (e) => {
    ui = { ...IDLE };
    paint();
    $('input[name="url"]', h).value = e.detail.url;
    $('textarea[name="caption"]', h).value = e.detail.caption || '';
    readLink(e.detail.url, e.detail.caption || '');
  });
  paint();
}

export function renderImporter() {
  const h = host();
  if (!h) return;
  const list = $('.imp-saved', h);
  const next = impSaved(store.get());
  if (list) { if (next) list.outerHTML = next; else list.remove(); } else if (next) h.insertAdjacentHTML('beforeend', next);
  $$('.imp-match', h).forEach((m) => {
    const id = $('[data-imp-on]', m)?.dataset.impOn;
    if (id && store.get().picks[id]) $('[data-imp-on]', m).innerHTML = 'Show it';
  });
}
