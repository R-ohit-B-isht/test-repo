import { $, html } from '../dom.js';
import { icon } from '../icons.js';

// Connectivity + install chrome. One floating pill (#netbar) that says:
//   offline  → your saved plan works, Gemini / booking links / reels do not;
//   install  → the browser offered "add to home screen" (Chromium only);
//   update   → a new service worker is waiting; reload to get it;
//   shared / badShare → what happened to the plan carried in a shared link.
// State pattern: exactly one message shows at a time, offline wins.

let installPrompt = null;
let waitingWorker = null;
let notice = null;

const MSG = {
  offline: () => html`${icon('offline')}<span>Offline · plan saved. Brain, booking and reels need data.</span>`,
  shared: () => html`${icon('link')}<span>Shared plan loaded · picks, route and travellers replaced</span><button type="button" data-net="dismiss-notice" aria-label="Dismiss">×</button>`,
  badShare: () => html`${icon('shield')}<span>That link's plan could not be read · showing your saved plan</span><button type="button" data-net="dismiss-notice" aria-label="Dismiss">×</button>`,
  install: () => html`${icon('download')}<span>Keep it on your phone</span><button type="button" data-net="install">Install</button><button type="button" data-net="dismiss" aria-label="Not now">×</button>`,
  update: () => html`${icon('sparkle')}<span>New version ready</span><button type="button" data-net="reload">Reload</button>`,
};

const pick = () => {
  if (!navigator.onLine) return 'offline';
  if (notice) return notice;
  if (waitingWorker) return 'update';
  if (installPrompt && !sessionStorage.getItem('install-dismissed')) return 'install';
  return null;
};

const show = () => {
  const bar = $('#netbar');
  if (!bar) return;
  const key = pick();
  document.documentElement.dataset.net = navigator.onLine ? 'online' : 'offline';
  bar.hidden = !key;
  bar.innerHTML = key ? MSG[key]() : '';
};

const onWorker = (reg) => {
  if (reg.waiting) waitingWorker = reg.waiting;
  reg.addEventListener('updatefound', () => {
    const w = reg.installing;
    w?.addEventListener('statechange', () => {
      if (w.state === 'installed' && navigator.serviceWorker.controller) { waitingWorker = w; show(); }
    });
  });
  show();
};

export function mountNet(shared) {
  const bar = $('#netbar');
  if (!bar) return;
  if (shared === 'applied' || shared === 'bad') {
    notice = shared === 'applied' ? 'shared' : 'badShare';
    setTimeout(() => { notice = null; show(); }, 8000);
  }
  window.addEventListener('online', show);
  window.addEventListener('offline', show);
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; show(); });
  window.addEventListener('appinstalled', () => { installPrompt = null; show(); });
  bar.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-net]');
    if (!b) return;
    if (b.dataset.net === 'install' && installPrompt) { await installPrompt.prompt(); installPrompt = null; }
    if (b.dataset.net === 'dismiss') sessionStorage.setItem('install-dismissed', '1');
    if (b.dataset.net === 'dismiss-notice') notice = null;
    if (b.dataset.net === 'reload' && waitingWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
      waitingWorker.postMessage('skip-waiting');
    }
    show();
  });
  if ('serviceWorker' in navigator) navigator.serviceWorker.ready.then(onWorker).catch(() => {});
  show();
}
