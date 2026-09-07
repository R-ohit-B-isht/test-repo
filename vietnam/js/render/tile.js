import { html } from '../dom.js';
import { icon } from '../icons.js';
import { isExtra, isFun } from '../data/activities.js';
import { dayOf } from '../plan.js';
import { priceTag, srcIcon, includesText, mustMark } from './picks.js';
import { strip, galleryClick } from './gallery.js';

// One activity tile: photo strip, name, note, status badge, price, source.
// Shared by the picker grid, the "+days" cards and the day board.

// Off-route picks never enter the plan, so for them "on" just means wished for.
export const statusOf = (x, state, plan) => {
  if (x.closed) return 'closed';
  if (plan.bundled.has(x.id)) return 'bundled';
  if (!state.picks[x.id]) return 'off';
  return isExtra(x) || dayOf(plan, x.id) != null ? 'on' : 'noroom';
};

const badge = (x, status, plan) => {
  if (status === 'on') return dayOf(plan, x.id) != null ? html`<span class="chip chip-ink num">D${dayOf(plan, x.id)}</span>` : '';
  if (status === 'noroom') return html`<span class="chip chip-sun">no room</span>`;
  if (status === 'bundled') return html`<span class="chip chip-jade">in tour</span>`;
  if (status === 'closed') return html`<span class="chip">closed</span>`;
  return '';
};

export const tile = (x, state, plan) => {
  const status = statusOf(x, state, plan);
  const dead = status === 'closed' || status === 'bundled';
  // The card is a div with a full-bleed <button class="hit"> underneath, so the
  // photo strip and source <a> can sit on top without nesting interactive content.
  return html`
    <div class="tile ${status === 'on' ? 'is-on' : ''} ${status === 'noroom' ? 'is-noroom' : ''} ${dead ? 'is-dead' : ''} ${isFun(x) ? '' : 'is-see'}">
      <button class="hit" type="button" data-pick="${x.id}" aria-pressed="${String(status === 'on' || status === 'noroom')}" ${dead ? 'disabled' : ''}
        aria-label="${x.name}${x.must ? ' (must-do)' : ''}${isFun(x) ? '' : ' (sight, no slot)'}" title="${x.closed || x.note || ''}"></button>
      ${strip(x)}
      <span class="ic-wrap">${icon(status === 'on' ? 'check' : x.icon)}</span>
      ${isFun(x) ? '' : html`<span class="kind" title="a sight — rides along, never takes a slot">${icon('eye')}see</span>`}
      <span class="body">
        <span class="nm">${x.name}${mustMark(x)}</span>
        <span class="sub">${x.closed || x.note || ''}${x.includes ? html` · incl. ${includesText(x)}` : ''}</span>
      </span>
      <span class="meta">${badge(x, status, plan)}${priceTag(x, state.travellers)}${srcIcon(x)}</span>
    </div>`;
};

// Tap anywhere on the card — photo included — flips the pick; gallery arrows
// and source links are the only parts that do their own thing.
export const pickHandler = (store) => (e) => {
  if (galleryClick(e) || e.target.closest('a')) return false;
  const b = e.target.closest('[data-pick]') || e.target.closest('.tile')?.querySelector('[data-pick]');
  if (!b || b.disabled) return false;
  store.togglePick(b.dataset.pick);
  return true;
};
