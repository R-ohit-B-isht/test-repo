import { html } from '../../dom.js';
import { icon } from '../../icons.js';
import { GROUPS, progressOf, recordOf, liveFiles } from '../../vault/slots.js';
import { fmtBytes } from '../../vault/files.js';

// Manager header (progress ring, files count, storage line) and the
// "add your own slot" form. Markup only.

const R = 26; const C = 2 * Math.PI * R;

export const ring = (done, total) => html`
  <svg class="ms-ring" viewBox="0 0 64 64" role="img" aria-label="${done} of ${total} done">
    <circle cx="32" cy="32" r="${R}" />
    <circle cx="32" cy="32" r="${R}" style="stroke-dasharray: ${C}; stroke-dashoffset: ${C * (1 - (total ? done / total : 0))}" />
    <text x="32" y="36" text-anchor="middle">${done}<tspan>/${total}</tspan></text>
  </svg>`;

const line = (done, total) => {
  if (!total) return 'Nothing to hold yet.';
  if (done === total) return 'Everything in hand. Go pack.';
  if (!done) return 'Tap a stage on each card as you book. Drop the PDF in when it lands.';
  return `${total - done} still to sort. Booked ones can wait for the confirmation PDF.`;
};

export const head = (state, slots) => {
  const { done, total } = progressOf(state, slots);
  const files = slots.flatMap((s) => liveFiles(recordOf(state, s.id)));
  const bytes = files.reduce((n, f) => n + (f.size || 0), 0);
  return html`
    ${ring(done, total)}
    <div class="ms-headtxt">
      <p class="ms-line">${line(done, total)}</p>
      <p class="sub">${icon('folder')}${files.length} file${files.length === 1 ? '' : 's'}${bytes ? ` · ${fmtBytes(bytes)} on this device` : ''} · ${icon('shield')}never in a share link, never uploaded</p>
    </div>`;
};

export const groupNav = (groups) => groups.map((g) => html`<a class="chip" href="#g-${g.id}">${icon(g.icon)}${g.label}<b>${g.slots.length}</b></a>`);

export const addForm = () => html`
  <form class="ms-add card" id="mgr-add" autocomplete="off">
    <h3>${icon('plus')}Anything else to keep?</h3>
    <div class="ms-addrow">
      <input type="text" name="title" placeholder="Forex card, bus pass, hotel voucher…" required maxlength="60" aria-label="What to keep" />
      <select name="group" aria-label="Group">${GROUPS.map((g) => html`<option value="${g.id}" ${g.id === 'stuff' ? 'selected' : ''}>${g.label}</option>`)}</select>
      <button class="btn" type="submit">Add slot</button>
    </div>
  </form>`;
