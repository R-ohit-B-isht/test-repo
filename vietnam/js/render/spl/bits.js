import { html, inr } from '../../dom.js';
import { icon } from '../../icons.js';
import { personOf } from '../../split/model.js';

// Small shared pieces of the Split page: avatars, signed money, empty state.

export const avatar = (p, size = '') => (p
  ? html`<span class="av ${size}" style="--h: ${p.hue}" aria-hidden="true">${p.name.trim().charAt(0).toUpperCase()}</span>`
  : html`<span class="av ${size} av-x" aria-hidden="true">?</span>`);

export const avatarOf = (state, id, size) => avatar(personOf(state, id), size);

// A signed rupee figure with the verb people actually use.
export const signed = (n, { lend = 'lent', owe = 'owe', zero = 'even' } = {}) => {
  if (n > 0) return html`<span class="money is-up">${icon('arrow')}<b>${inr(n)}</b><small>${lend}</small></span>`;
  if (n < 0) return html`<span class="money is-down">${icon('arrow')}<b>${inr(-n)}</b><small>${owe}</small></span>`;
  return html`<span class="money is-even"><b>—</b><small>${zero}</small></span>`;
};

export const empty = (title, sub, cta) => html`
  <div class="spl-empty">
    <span class="spl-empty-ic">${icon('wallet')}</span>
    <h3>${title}</h3>
    <p class="sub">${sub}</p>
    ${cta || ''}
  </div>`;
