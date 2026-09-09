import { $, html } from '../dom.js';
import { icon } from '../icons.js';
import { livePeople, personOf } from '../split/model.js';
import { addPerson, claimMe } from './spl/actions.js';
import { avatar } from './spl/bits.js';
import { shareUrl } from '../share.js';
import { brainCta } from './brain.js';
import { conflicts, conflictPrompt, leaderboard, votesByPerson, totalHearts, MAX_VOTERS } from '../votes.js';

// Group votes (Airbnb wishlist hearts). The heart on every tile is wired here
// for the whole document, so the picker, the "+days" cards and the day board
// all share one handler. Tapping a heart before you have a name opens a tiny
// "who are you?" sheet — the same person record Split uses.

const toast = (text) => document.dispatchEvent(new CustomEvent('toast', { detail: { text } }));

const CONFLICT = {
  off: (names) => html`<span class="chip chip-sun">off</span><span>${names.join(', ')} want${names.length === 1 && names[0] !== 'you' ? 's' : ''} it</span>`,
  noroom: (names) => html`<span class="chip chip-sun">no room</span><span>${names.join(', ')} want${names.length === 1 && names[0] !== 'you' ? 's' : ''} it</span>`,
  unloved: () => html`<span class="chip">paid, 0 ♥</span><span>on, nobody hearted it</span>`,
};

const whoSheet = () => html`
  <div class="overlay who" id="who" data-open="false" role="dialog" aria-modal="true" aria-labelledby="who-title" aria-hidden="true">
    <form class="card" id="who-form" autocomplete="off">
      <div class="card-head">
        <h3 id="who-title">${icon('heart')}Who's hearting?</h3>
        <button class="btn-icon" type="button" data-close aria-label="Close">${icon('x')}</button>
      </div>
      <p class="sub">Your name stays in this browser. Friends see it next to what you want.</p>
      <div class="who-row">
        <input type="text" name="name" placeholder="Your name" required maxlength="24" aria-label="Your name" autocomplete="given-name" />
        <button class="btn btn-primary" type="submit">${icon('check')}That's me</button>
      </div>
    </form>
  </div>`;

export const votesCard = (state, plan) => {
  const people = livePeople(state);
  const total = totalHearts(state);
  const top = leaderboard(state).slice(0, 5);
  const fights = conflicts(state, plan);
  const you = personOf(state, state.me);
  const byPerson = votesByPerson(state);
  const voters = byPerson.filter((v) => v.n).length;
  return html`
    <div class="card votes" id="votes">
      <div class="votes-head">
        <div>
          <span class="eyebrow">${icon('heart')}Group votes</span>
          <h3>${total ? html`${total} heart${total === 1 ? '' : 's'} · ${voters} voter${voters === 1 ? '' : 's'}` : 'Heart what you want. Friends vote from their phone.'}</h3>
        </div>
        <div class="votes-cta">
          <button class="btn" type="button" data-votes-share>${icon('share')}Copy vote link</button>
          ${fights.length ? brainCta(conflictPrompt(fights), 'Resolve with Gemini') : ''}
        </div>
      </div>
      <div class="votes-people">
        ${byPerson.map(({ p, n }) => html`<span class="vchip ${p.id === state.me ? 'is-me' : ''}">${avatar(p, 'sm')}<span>${p.id === state.me ? 'You' : p.name}</span><b class="num">${n}</b></span>`)}
        ${!you ? html`<button class="vchip vchip-add" type="button" data-who>${icon('plus')}Say who you are</button>` : ''}
        ${people.length >= MAX_VOTERS ? html`<span class="sub">${MAX_VOTERS} voters max</span>` : ''}
      </div>
      ${top.length ? html`
        <ol class="votes-top">
          ${top.map(({ x, n, names }) => html`<li><span class="ic-wrap">${icon(x.icon)}</span><span class="nm">${x.name}</span><span class="who">${names.join(', ')}</span><b class="num">${icon('heart')}${n}</b></li>`)}
        </ol>` : html`<p class="sub votes-empty">Nothing hearted yet. Tap ${icon('heart')} on any tile below — the count is the whole group's, one heart each.</p>`}
      ${fights.length ? html`
        <ul class="votes-fights">
          ${fights.slice(0, 6).map(({ x, kind, names }) => html`<li><span class="nm">${x.name}</span>${CONFLICT[kind](names)}</li>`)}
          ${fights.length > 6 ? html`<li class="sub">+${fights.length - 6} more</li>` : ''}
        </ul>` : (total ? html`<p class="sub votes-empty">${icon('check')}Plan and votes agree.</p>` : '')}
    </div>`;
};

export function mountVotes(store) {
  if (!$('#who')) document.body.insertAdjacentHTML('beforeend', whoSheet());
  const who = $('#who');
  const form = $('#who-form', who);
  let pending = null;
  let lastFocus = null;
  const setOpen = (open) => {
    who.dataset.open = String(open);
    who.setAttribute('aria-hidden', String(!open));
    if (open) { lastFocus = document.activeElement; $('input', form).focus(); } else { lastFocus?.focus(); lastFocus = null; pending = null; }
  };
  // Re-render replaces the button, so keyboard focus is put back on its successor.
  const refocus = (id, root) => $(`[data-heart="${id}"]`, root)?.focus({ preventScroll: true });
  const heart = (btn) => {
    const id = btn.dataset.heart;
    const state = store.get();
    const me = personOf(state, state.me);
    if (!me || me.deleted) { pending = id; return setOpen(true); }
    const root = btn.closest('[id]') || document;
    const hadFocus = document.activeElement === btn;
    store.toggleHeart(id, state.me);
    if (hadFocus) refocus(id, root.isConnected ? root : document);
    return undefined;
  };
  document.addEventListener('click', async (e) => {
    const h = e.target.closest('[data-heart]');
    if (h) { e.preventDefault(); e.stopPropagation(); return heart(h); }
    if (e.target.closest('[data-who]')) return setOpen(true);
    if (e.target === who || e.target.closest('#who [data-close]')) return setOpen(false);
    const share = e.target.closest('[data-votes-share]');
    if (share) {
      const url = shareUrl(store.get());
      try { await navigator.clipboard.writeText(url); toast('Vote link copied. Friends heart on their phone, then send theirs back.'); } catch { toast('Could not copy — use Book › Share.'); }
    }
    return undefined;
  }, true);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = new FormData(form).get('name');
    const state = store.get();
    const existing = livePeople(state).find((p) => p.name.toLowerCase() === String(name).trim().toLowerCase());
    const id = existing ? existing.id : addPerson(store, name, true);
    if (!id) return;
    claimMe(store, id);
    const want = pending;
    form.reset();
    setOpen(false);
    if (want) store.toggleHeart(want, id);
  });
  who.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}
