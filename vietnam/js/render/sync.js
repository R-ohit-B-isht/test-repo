import { $, html } from '../dom.js';
import { icon } from '../icons.js';
import { IS_DEV, SYNC_URL, SYNC_URL_SLOT } from '../config.js';
import { cleanCode } from '../sync.js';

// Room card (Book › Take it with you). Three states: no server set (honest,
// dev can point at one) · not in a room (open / join) · in a room (the code,
// copy / send / leave, a live status line). The engine owns the network; this
// only paints `sync:status` and forwards taps.

let engine = null;
let flash = '';
let flashTimer = 0;

const ago = (t) => {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s} s ago`;
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
};

const statusLine = (st) => {
  if (st.error) return html`<p class="sync-msg is-err" role="alert">${icon('shield')}${st.error}</p>`;
  if (st.phase === 'busy') return html`<p class="sync-msg" aria-live="polite"><span class="spin"></span>Syncing…</p>`;
  if (st.at) return html`<p class="sync-msg is-ok" aria-live="polite">${icon('check')}Synced ${ago(st.at)}${st.pulled ? ` · ${st.pulled} change${st.pulled === 1 ? '' : 's'} came in` : ''}</p>`;
  return '';
};

const unset = () => html`
  <p class="sub">Needs the small sync server from <code>vietnam-sync/</code>. Not set up on this device yet — until then everything stays in this browser only.</p>
  ${IS_DEV ? html`
    <form class="sync-form" id="sync-url" autocomplete="off">
      <input name="url" type="url" inputmode="url" spellcheck="false" placeholder="http://127.0.0.1:8000" aria-label="Sync server URL" value="${SYNC_URL}" required />
      <button class="btn" type="submit">${icon('check')}Use this server</button>
    </form>` : ''}`;

const off = (st) => html`
  <p class="sub">Open a room, send the 6-letter code, and everyone's picks, hearts, people and expenses stay the same on every phone. Documents, photos, GPS and cash never sync.</p>
  <div class="row">
    <button class="btn btn-primary" type="button" data-sync="open" ${st.phase === 'busy' ? 'disabled' : ''}>${icon('users')}Open a room</button>
    <form class="sync-form" id="sync-join" autocomplete="off">
      <input name="code" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="7" placeholder="ROOM CODE" aria-label="Room code" required />
      <button class="btn" type="submit" ${st.phase === 'busy' ? 'disabled' : ''}>${icon('arrow')}Join</button>
    </form>
  </div>
  ${statusLine(st)}`;

const on = (st) => html`
  <p class="sub">Anyone with this code and this site is in. Newer tap wins when two of you change the same thing.</p>
  <div class="sync-code" aria-label="Room code">${st.room.split('').map((c) => html`<span>${c}</span>`)}</div>
  <div class="row">
    <button class="btn" type="button" data-sync="copy">${icon('link')}Copy code</button>
    ${navigator.share ? html`<button class="btn" type="button" data-sync="share">${icon('send')}Send…</button>` : ''}
    <button class="btn btn-ghost" type="button" data-sync="now" ${st.phase === 'busy' ? 'disabled' : ''}>${icon('undo')}Sync now</button>
    <button class="btn btn-ghost" type="button" data-sync="leave">Leave room</button>
    <output id="sync-out" aria-live="polite">${flash}</output>
  </div>
  ${statusLine(st)}`;

export const syncCard = (st, configured) => html`
  <span class="ic-wrap">${icon('users')}</span>
  <div class="sync-body">
    <span class="eyebrow">Friends · optional</span>
    <h3>${st.room ? 'You are in a room.' : 'Sync with your friends.'}</h3>
    ${!configured ? unset() : st.room ? on(st) : off(st)}
  </div>`;

const paint = () => {
  const host = $('#sync-card');
  if (!host || !engine) return;
  const st = engine.status();
  host.innerHTML = syncCard(st, engine.configured());
  host.classList.toggle('is-on', !!st.room);
};

const say = (msg) => {
  flash = msg;
  clearTimeout(flashTimer);
  paint();
  flashTimer = setTimeout(() => { flash = ''; paint(); }, 2400);
};

export function mountSync(eng) {
  engine = eng;
  const host = $('#sync-card');
  if (!host) return;
  document.addEventListener('sync:status', paint);
  host.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-sync]');
    if (!b) return;
    const st = engine.status();
    if (b.dataset.sync === 'open') { try { await engine.open(); } catch { /* painted by status */ } }
    if (b.dataset.sync === 'now') engine.tick();
    if (b.dataset.sync === 'leave') engine.leave();
    if (b.dataset.sync === 'copy') {
      try { await navigator.clipboard.writeText(st.room); say('Copied'); } catch { say('Read it out loud'); }
    }
    if (b.dataset.sync === 'share') {
      try { await navigator.share({ title: 'Join my Vietnam plan', text: `Open ${location.origin}${location.pathname.replace(/[^/]*$/, 'book.html')} → Sync with your friends → Join with code ${st.room}` }); } catch { /* cancelled */ }
    }
  });
  host.addEventListener('submit', async (e) => {
    const f = e.target;
    e.preventDefault();
    if (f.id === 'sync-join') {
      const code = cleanCode(new FormData(f).get('code'));
      try { await engine.join(code); } catch { /* painted by status */ }
    }
    if (f.id === 'sync-url') {
      const url = String(new FormData(f).get('url') || '').trim().replace(/\/+$/, '');
      if (url) localStorage.setItem(SYNC_URL_SLOT, url); else localStorage.removeItem(SYNC_URL_SLOT);
      location.reload();
    }
  });
  host.addEventListener('input', (e) => {
    if (e.target.name === 'code') {
      const v = cleanCode(e.target.value);
      e.target.value = v.length > 3 ? `${v.slice(0, 3)} ${v.slice(3)}` : v;
    }
  });
  paint();
  setInterval(() => { if (engine.status().room && engine.status().phase === 'idle') paint(); }, 15000);
}

export const renderSync = () => paint();
