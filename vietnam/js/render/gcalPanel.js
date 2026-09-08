import { $, html } from '../dom.js';
import { icon } from '../icons.js';
import { GCAL_NAME } from '../config.js';
import { eventsFor } from '../events.js';
import { exportable } from '../export/ics.js';
import { GCAL_IMPORT } from '../export/gcal.js';
import * as gcal from '../gcal/sync.js';

// Google Calendar panel on the Calendar page. Two tiers, both honest about
// what they need: (1) no setup — the .ics file above imports into any Google
// Calendar; every event sheet also has an "Add to Google Calendar" link.
// (2) two-way sync — bring your own OAuth client id (kept in its own local
// slot), connect, then push the plan into a "Vietnam · Oct 2026" calendar
// and pull back anything you add there. Nothing here pretends to be synced
// until Google has actually answered.

let busy = null;
let error = null;
let last = null;
let store = null;

const state = () => {
  if (busy) return 'busy';
  if (gcal.isConnected()) return 'on';
  if (gcal.getClientId()) return 'ready';
  return 'unset';
};

const setup = () => html`
  <details class="gc-setup">
    <summary>${icon('info')}How to get a client id (5 min, free)</summary>
    <ol>
      <li>Google Cloud console → new project → enable the <b>Google Calendar API</b>.</li>
      <li>APIs &amp; Services → Credentials → <b>OAuth client ID</b> → Web application.</li>
      <li>Add <code>${location.origin}</code> as an authorised JavaScript origin.</li>
      <li>Add yourself as a test user on the OAuth consent screen, paste the client id here.</li>
    </ol>
  </details>`;

const status = () => {
  if (error) return html`<p class="gc-msg is-err" role="alert">${icon('shield')}${error}</p>`;
  if (busy) return html`<p class="gc-msg" aria-live="polite"><span class="spin"></span>${busy}</p>`;
  if (last) return html`<p class="gc-msg is-ok" aria-live="polite">${icon('check')}${last}</p>`;
  const n = gcal.syncedCount();
  return n ? html`<p class="gc-msg">${icon('calendar')}${n} events live in “${GCAL_NAME}”.</p>` : '';
};

export const gcalPanel = (s) => {
  const st = state();
  const n = exportable(eventsFor(s)).length;
  return html`
    <div class="gc-tier">
      <span class="eyebrow">Zero setup</span>
      <p class="sub">Download the .ics above, then Google Calendar → Settings → Import. ${n} events. Or tap any event for a one-tap “Add to Google Calendar”.</p>
      <a class="btn btn-ghost" href="${GCAL_IMPORT}" target="_blank" rel="noopener noreferrer">${icon('link')}Open Google import</a>
    </div>
    <div class="gc-tier">
      <span class="eyebrow">Two-way sync · optional</span>
      ${st === 'unset' ? html`
        <p class="sub">Needs a Google OAuth client id — yours, stored only in this browser. Not set up yet.</p>
        <form class="gc-form" id="gc-form">
          <input name="cid" inputmode="text" autocomplete="off" spellcheck="false" placeholder="xxxx.apps.googleusercontent.com" aria-label="Google OAuth client id" required />
          <button class="btn" type="submit">${icon('check')}Save</button>
        </form>
        ${setup()}` : html`
        <div class="row">
          ${st === 'on' ? html`
            <span class="chip chip-sun">${icon('check')} Connected</span>
            <button class="btn" type="button" data-gc="push" ${busy ? 'disabled' : ''}>${icon('upload')}Push ${n} to Google</button>
            <button class="btn" type="button" data-gc="pull" ${busy ? 'disabled' : ''}>${icon('download')}Pull from Google</button>
            <button class="btn btn-ghost" type="button" data-gc="off">Disconnect</button>` : html`
            <button class="btn" type="button" data-gc="connect" ${busy ? 'disabled' : ''}>${icon('calendar')}Connect Google</button>
            <button class="btn btn-ghost" type="button" data-gc="unset">Change client id</button>`}
        </div>`}
      ${status()}
    </div>`;
};

const paint = () => { const h = $('#cal-gcal'); if (h) h.innerHTML = gcalPanel(store.get()); };

const run = async (label, fn) => {
  busy = label; error = null; last = null; paint();
  try { last = await fn(); } catch (e) { error = e.message || String(e); }
  busy = null; paint();
};

export function mountGcalPanel(s) {
  store = s;
  const host = $('#cal-gcal');
  if (!host) return;
  host.addEventListener('submit', (e) => {
    e.preventDefault();
    const cid = new FormData(e.target).get('cid');
    if (typeof cid === 'string' && cid.trim()) { gcal.setClientId(cid); error = null; paint(); }
  });
  host.addEventListener('click', (e) => {
    const b = e.target.closest('[data-gc]');
    if (!b) return;
    const act = b.dataset.gc;
    if (act === 'unset') { gcal.setClientId(''); gcal.forget(); last = null; error = null; return paint(); }
    if (act === 'off') { gcal.forget(); last = 'Disconnected. Synced copies stay in Google; the link between them is cleared.'; return paint(); }
    if (act === 'connect') return run('Waiting for Google sign-in…', async () => { await gcal.connect(); return 'Connected. Nothing pushed yet.'; });
    if (act === 'push') {
      return run('Pushing…', async () => {
        const st = store.get();
        const events = exportable(eventsFor(st)).filter((e) => !e.own?.gcal);
        const removed = st.events.filter((x) => x.deleted).map((x) => x.id);
        const r = await gcal.push(events, removed, (n, t) => { busy = `Pushing ${n} / ${t}…`; paint(); });
        return `${r.pushed} events in “${GCAL_NAME}”${r.removed ? `, ${r.removed} removed` : ''}.`;
      });
    }
    if (act === 'pull') {
      return run('Pulling…', async () => {
        const known = store.get().events.map((x) => x.gcal).filter(Boolean);
        const fresh = await gcal.pull(known);
        fresh.forEach((ev) => store.addEvent({ ...ev, created: Date.now() }));
        return fresh.length ? `${fresh.length} new from Google, now on your calendar.` : 'Nothing new in Google.';
      });
    }
    return undefined;
  });
}
