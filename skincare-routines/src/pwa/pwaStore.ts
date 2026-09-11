import { useSyncExternalStore } from 'react';
import { registerSW } from 'virtual:pwa-register';

/** Chrome's pre-install event (not in lib.dom): holding it lets the app show its own Install button. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PwaState {
  online: boolean;
  /** Running from the home screen (standalone) rather than a browser tab. */
  standalone: boolean;
  /** The browser offered installation and the user has not answered yet. */
  installable: boolean;
  /** iOS Safari never fires beforeinstallprompt: install is Share → Add to Home Screen. */
  iosHint: boolean;
  /** A newer build is waiting; `applyUpdate` swaps it in and reloads. */
  updateReady: boolean;
  offlineReady: boolean;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && navigator.standalone === true);

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window);

let state: PwaState = {
  online: navigator.onLine,
  standalone: isStandalone(),
  installable: false,
  iosHint: isIos() && !isStandalone(),
  updateReady: false,
  offlineReady: false,
};
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let updateSW: ((reload?: boolean) => Promise<void>) | null = null;
const listeners = new Set<() => void>();

const patch = (p: Partial<PwaState>) => {
  state = { ...state, ...p };
  listeners.forEach((l) => l());
};

let started = false;
/** Wire the browser events once; safe to call from any component. */
export function startPwa() {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('online', () => patch({ online: true }));
  window.addEventListener('offline', () => patch({ online: false }));
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    patch({ installable: true });
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    patch({ installable: false, iosHint: false, standalone: true });
  });
  window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => patch({ standalone: e.matches }));
  if ('serviceWorker' in navigator) {
    updateSW = registerSW({
      onNeedRefresh: () => patch({ updateReady: true }),
      onOfflineReady: () => patch({ offlineReady: true }),
      onRegisterError: () => undefined,
    });
  }
}

/** Show the browser's install sheet; resolves to whether the user accepted. */
export async function promptInstall(): Promise<boolean> {
  const ev = deferredPrompt;
  if (!ev) return false;
  deferredPrompt = null;
  patch({ installable: false });
  await ev.prompt();
  const { outcome } = await ev.userChoice;
  if (outcome !== 'accepted') patch({ installable: true, iosHint: false });
  return outcome === 'accepted';
}

export function applyUpdate() {
  patch({ updateReady: false });
  void updateSW?.(true);
}

export const dismissUpdate = () => patch({ updateReady: false });
export const dismissOfflineReady = () => patch({ offlineReady: false });

export function usePwa(): PwaState {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => state,
    () => state,
  );
}
