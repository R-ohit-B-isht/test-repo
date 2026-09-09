import { $, html } from '../dom.js';
import { icon } from '../icons.js';
import { shareUrl } from '../share.js';
import { buildICS, ICS_NAME } from '../export/ics.js';

// Take-it-with-you card row: share link (URL carries picks + route + dials,
// never the Gemini key), print / save as PDF, and an .ics for any calendar.

const card = (id, ic, title, blurb, body) => html`
  <div class="card xcard" id="xcard-${id}">
    <span class="ic-wrap">${icon(ic)}</span>
    <h3>${title}</h3>
    <p>${blurb}</p>
    ${body}
  </div>`;

const view = () => html`
  ${card('share', 'link', 'Share the plan', 'One link holds your picks, route, travellers and hearts. Open it anywhere.', html`
    <div class="row">
      <button class="btn btn-primary" type="button" data-x="share">${icon('link')}Copy link</button>
      ${navigator.share ? html`<button class="btn" type="button" data-x="native">Send…</button>` : ''}
      <output id="x-share-out" aria-live="polite"></output>
    </div>
    <span class="url" id="x-share-url"></span>`)}
  ${card('print', 'grid', 'Print or PDF', 'Days, picks, prices and the checklist, on paper. Use “Save as PDF”.', html`
    <div class="row"><button class="btn" type="button" data-x="print">${icon('grid')}Print this plan</button></div>`)}
  ${card('ics', 'calendar', 'Add to calendar', 'Every day, flight, train, pick and meal as events. Google, Apple, Outlook.', html`
    <div class="row">
      <a class="btn" id="x-ics" download="${ICS_NAME}" href="#">${icon('calendar')}Download .ics</a>
      <output id="x-ics-out" aria-live="polite"></output>
    </div>`)}`;

const flash = (out, msg) => {
  out.textContent = msg;
  clearTimeout(out._t);
  out._t = setTimeout(() => { out.textContent = ''; }, 2400);
};

let icsUrl = null;

export function mountExport(store) {
  const host = $('#export');
  if (!host) return;
  host.innerHTML = view();
  host.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-x]');
    if (!b) return;
    const url = shareUrl(store.get());
    const out = $('#x-share-out', host);
    if (b.dataset.x === 'print') window.print();
    if (b.dataset.x === 'share') {
      try { await navigator.clipboard.writeText(url); flash(out, 'Copied'); } catch { flash(out, 'Select the link below'); }
    }
    if (b.dataset.x === 'native') {
      try { await navigator.share({ title: 'Vietnam plan', url }); } catch { /* cancelled */ }
    }
  });
  $('#x-ics', host).addEventListener('click', () => flash($('#x-ics-out', host), 'Saved'));
}

export function renderExport(state) {
  const host = $('#export');
  if (!host) return;
  $('#x-share-url', host).textContent = shareUrl(state);
  if (icsUrl) URL.revokeObjectURL(icsUrl);
  icsUrl = URL.createObjectURL(new Blob([buildICS(state)], { type: 'text/calendar;charset=utf-8' }));
  $('#x-ics', host).href = icsUrl;
}
