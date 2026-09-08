// The site is one page per section. `id` matches <body data-page>, and the old
// single-page anchors (#days, #picker …) still land on the right page.
export const PAGES = [
  { id: 'route', href: 'index.html', label: 'Route', icon: 'pin', n: '02', hashes: ['top', 'hero', 'route', 'map'] },
  { id: 'days', href: 'days.html', label: 'Days', icon: 'grid', n: '03', hashes: ['days', 'shelf'] },
  { id: 'picks', href: 'picks.html', label: 'Picks', icon: 'sparkle', n: '04', hashes: ['picker', 'picks'] },
  { id: 'budget', href: 'budget.html', label: 'Budget', icon: 'ticket', n: '05', hashes: ['budget'] },
  { id: 'calendar', href: 'calendar.html', label: 'Calendar', icon: 'calendar', n: '06', hashes: ['calendar'] },
  { id: 'book', href: 'book.html', label: 'Book', icon: 'check', n: '07', hashes: ['checklist', 'book', 'share'] },
  { id: 'manager', href: 'manager.html', label: 'Manager', icon: 'folder', n: '08', hashes: ['manager', 'vault', 'docs'] },
  { id: 'split', href: 'split.html', label: 'Split', icon: 'wallet', n: '09', hashes: ['split', 'expenses', 'owe'] },
  { id: 'sources', href: 'sources.html', label: 'Sources', icon: 'link', n: '10', hashes: ['sources'], quiet: true },
];

export const currentPage = () => document.body.dataset.page || 'route';
export const pageOf = (id) => PAGES.find((p) => p.id === id);
export const pageForHash = (hash) => PAGES.find((p) => p.hashes.includes(hash.replace(/^#/, '')));
export const neighbours = (id) => {
  const i = PAGES.findIndex((p) => p.id === id);
  return { prev: PAGES[i - 1], next: PAGES[i + 1] };
};
