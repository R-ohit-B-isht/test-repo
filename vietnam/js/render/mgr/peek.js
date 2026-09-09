import { $, html } from '../../dom.js';
import { icon } from '../../icons.js';
import { isImage, urlFor } from '../../vault/files.js';

// Full-screen preview of one stored file (image or PDF). Read-only; the object
// URL comes from vault/files.js and never touches the network.

let lastFocus = null;

const face = (meta, url) => html`
  <div class="card">
    <header class="pk-head">
      <h3 id="peek-title">${meta.name}</h3>
      <a class="btn btn-ghost" href="${url}" download="${meta.name}">${icon('download')}Download</a>
      <button class="btn-icon" type="button" data-close aria-label="Close">${icon('x')}</button>
    </header>
    ${isImage(meta)
      ? html`<img class="pk-img" src="${url}" alt="${meta.name}" />`
      : html`<iframe class="pk-pdf" src="${url}#toolbar=0" title="${meta.name}"></iframe>`}
  </div>`;

const missing = (meta) => html`
  <div class="card">
    <header class="pk-head"><h3 id="peek-title">${meta.name}</h3><button class="btn-icon" type="button" data-close aria-label="Close">${icon('x')}</button></header>
    <p class="pk-gone">${icon('info')}The file is no longer in this browser's storage. Drop it in again.</p>
  </div>`;

const setOpen = (root, on) => {
  root.dataset.open = String(on);
  root.setAttribute('aria-hidden', String(!on));
  document.body.classList.toggle('is-locked', on);
};

export async function openPeek(meta) {
  const root = $('#peek');
  if (!root) return;
  lastFocus = document.activeElement;
  const url = await urlFor(meta);
  root.innerHTML = url ? face(meta, url) : missing(meta);
  setOpen(root, true);
  $('[data-close]', root).focus();
}

export function mountPeek() {
  const root = $('#peek');
  if (!root) return;
  const close = () => { setOpen(root, false); root.innerHTML = ''; lastFocus?.focus(); lastFocus = null; };
  root.addEventListener('click', (e) => { if (e.target === root || e.target.closest('[data-close]')) close(); });
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}
