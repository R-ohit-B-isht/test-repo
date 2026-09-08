// Brain overlay: the Gemini planner. Mediates between the ask bar, the key
// sheet, the facade (ai/planner.js) and the store; the model only ever reaches
// the store through validated changes the traveller ticked and applied.
import { $, $$ } from '../dom.js';
import { keyStore, looksLikeKey } from '../ai/key.js';
import { propose } from '../ai/planner.js';
import { preview, applyChanges } from '../ai/apply.js';
import { shell, noteHtml, loadingHtml, suggestionsHtml, footHtml } from './plannerView.js';

const ERROR_COPY = {
  nokey: 'Add your Gemini key first (tap Key).',
  auth: 'That key was refused. Check it or make a new one.',
  quota: 'Gemini quota hit. Try again in a minute.',
  blocked: 'Gemini declined that ask. Try different words.',
  network: 'Could not reach Gemini. Check the connection.',
  malformed: 'Gemini replied with something unusable. Ask again.',
  api: 'Gemini error. Try again.',
};

export function mountPlanner(store) {
  const root = $('#brain');
  $('.card', root).insertAdjacentHTML('beforeend', shell(keyStore.has()));
  const out = $('#brain-out');
  const promptEl = $('#brain-prompt');
  const keyChip = $('#brain-key-toggle');
  const keySheet = $('#brain-key');
  const keyIn = $('#brain-key-in');
  let result = null;
  let undo = null;
  let ctrl = null;

  const syncKey = () => { keyChip.dataset.hasKey = String(keyStore.has()); };
  const ticked = () => (result ? result.changes.filter((c, i) => c.ok && $(`[data-sug="${i}"]`, out)?.checked) : []);
  const foot = () => {
    const el = $('#brain-foot', out);
    if (el && result) el.innerHTML = footHtml(preview(ticked(), store.get()), Boolean(undo));
  };

  function idle() {
    if (!keyStore.has()) out.innerHTML = noteHtml('Paste your own Gemini key (tap Key) and the plan starts listening. Suggestions, not fares: the ledger reprices after you apply.');
    else if (!result) out.innerHTML = '';
  }

  async function ask(text) {
    const prompt = text.trim();
    if (!prompt) return promptEl.focus();
    if (!keyStore.has()) { openKey(); out.innerHTML = noteHtml(ERROR_COPY.nokey, 'is-error'); return; }
    ctrl?.abort();
    ctrl = new AbortController();
    undo = null;
    root.dataset.busy = 'true';
    out.innerHTML = loadingHtml(prompt);
    try {
      result = await propose(store.get(), prompt, ctrl.signal);
      out.innerHTML = suggestionsHtml(result, store.get());
      foot();
    } catch (e) {
      if (e.name === 'AbortError') return;
      result = null;
      out.innerHTML = noteHtml(ERROR_COPY[e.kind] || ERROR_COPY.api, 'is-error');
      if (e.kind === 'auth' || e.kind === 'nokey') openKey();
    } finally {
      root.dataset.busy = 'false';
    }
  }

  function openKey(open = true) {
    keySheet.hidden = !open;
    keyChip.setAttribute('aria-expanded', String(open));
    if (open) keyIn.focus();
  }

  $('#brain-form').addEventListener('submit', (e) => { e.preventDefault(); ask(promptEl.value); });
  keyChip.addEventListener('click', () => openKey(keySheet.hidden));
  keySheet.addEventListener('submit', (e) => {
    e.preventDefault();
    const k = keyIn.value.trim();
    if (!looksLikeKey(k)) { out.innerHTML = noteHtml('That doesn’t look like a Gemini key (starts with AIza, 39 chars).', 'is-error'); return; }
    keyStore.set(k);
    keyIn.value = '';
    syncKey();
    openKey(false);
    out.innerHTML = noteHtml('Key saved in this browser only. Ask away.');
    promptEl.focus();
  });
  root.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-ask]');
    if (chip) { promptEl.value = chip.dataset.ask; ask(chip.dataset.ask); }
    if (e.target.closest('[data-key-clear]')) { keyStore.set(''); keyIn.value = ''; syncKey(); result = null; openKey(false); idle(); }
    if (e.target.closest('[data-apply]')) { undo = applyChanges(store, ticked()); $$('[data-sug]', out).forEach((c) => { c.disabled = true; }); foot(); }
    if (e.target.closest('[data-undo]')) { undo?.(); undo = null; $$('[data-sug]', out).forEach((c) => { c.disabled = false; }); foot(); }
  });
  out.addEventListener('change', (e) => { if (e.target.matches('[data-sug]')) foot(); });
  store.subscribe(() => { if (result && !undo) foot(); });
  idle();
  return { ask, fill: (text) => { promptEl.value = text; promptEl.focus(); } };
}
