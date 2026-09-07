import { html } from '../dom.js';
import { icon } from '../icons.js';

// Provider link chips (book.js output). Every chip opens a search or an
// official page in a new tab; none of them claim live prices or availability.
export const linkChips = (links) => links.map((l) => html`
  <a href="${l.url}" target="_blank" rel="noopener noreferrer" ${l.official ? 'data-official' : ''} title="${l.official ? 'Official site' : 'Opens a search on'} ${l.name}">
    ${l.name}${icon('link')}
  </a>`);
