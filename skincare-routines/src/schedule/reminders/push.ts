/** Browser side of push reminders: capability + permission checks, the PushManager subscription, and the small
 * `/api/reminders/*` client. Every failure becomes a plain sentence for the panel — nothing is retried silently. */
import { chatConfig } from '../../chat/config';
import type { PushSubscriptionJson, ReminderRecord } from './payload';

export type Support = 'ok' | 'insecure' | 'no-sw' | 'no-push' | 'no-notification' | 'ios-not-installed';

const isIos = () => /iP(hone|ad|od)/.test(navigator.userAgent);
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Why push cannot work here, or `ok`. iOS only exposes Web Push to home-screen apps (16.4+). */
export function pushSupport(): Support {
  if (!window.isSecureContext) return 'insecure';
  if (!('serviceWorker' in navigator)) return 'no-sw';
  if (!('Notification' in window)) return 'no-notification';
  if (!('PushManager' in window)) return isIos() && !standalone() ? 'ios-not-installed' : 'no-push';
  return 'ok';
}

export const SUPPORT_TEXT: Record<Exclude<Support, 'ok'>, string> = {
  insecure: 'Push needs a secure (https) page.',
  'no-sw': 'This browser has no service worker support, so it cannot receive push messages.',
  'no-push': 'This browser cannot receive push messages. Use the phone alarm export below instead.',
  'no-notification': 'This browser has no notification support. Use the phone alarm export below instead.',
  'ios-not-installed': 'On iPhone and iPad, push only works once the app is added to the Home Screen (iOS 16.4+). Add it there, then come back here.',
};

export type Permission = NotificationPermission;
export const permissionNow = (): Permission => ('Notification' in window ? Notification.permission : 'denied');

export interface ServerConfig { enabled: boolean; publicKey: string; serverTime: string; records: number; startedAt: string; lastTick: string | null }
export interface ServerStatus { registered: boolean; subscription: { sent: Record<string, string>; lastSentAt: string | null; lastError: string | null; failures: number } | null; publicKey: string }

const base = async () => (await chatConfig()).remindersApiBase;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${await base()}/api/reminders${path}`, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) } });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try { const j: unknown = await res.json(); if (j && typeof j === 'object' && 'detail' in j) detail = String((j as { detail: unknown }).detail); } catch { /* not JSON */ }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

/** `null` when the deployment has no reminder service (static host, 404/503, network error). */
export async function serverConfig(): Promise<ServerConfig | null> {
  try {
    const cfg = await call<ServerConfig>('/config');
    return cfg.enabled && typeof cfg.publicKey === 'string' && cfg.publicKey.length > 60 ? cfg : null;
  } catch {
    return null;
  }
}

export const putRecord = (record: ReminderRecord) => call<{ ok: true; publicKey: string }>('/subscription', { method: 'PUT', body: JSON.stringify(record) });
export const serverStatus = (endpoint: string) => call<ServerStatus>('/status', { method: 'POST', body: JSON.stringify({ endpoint }) });
export const sendTest = (endpoint: string, slot: 'am' | 'pm') => call<{ ok: true }>('/test', { method: 'POST', body: JSON.stringify({ endpoint, slot }) });
export const unsubscribeServer = (endpoint: string) => call<{ ok: true; removed: boolean }>('/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) });

function keyBytes(base64url: string): Uint8Array {
  const padded = `${base64url}${'='.repeat((4 - (base64url.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

const keyOf = (sub: PushSubscription): string | null => {
  const k = sub.options.applicationServerKey;
  if (!k) return null;
  return btoa(String.fromCharCode(...new Uint8Array(k))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export function toJson(sub: PushSubscription): PushSubscriptionJson {
  const j = sub.toJSON();
  if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) throw new Error('The browser returned an incomplete push subscription.');
  return { endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth }, expirationTime: typeof j.expirationTime === 'number' ? j.expirationTime : null };
}

/** Ask for permission (if not decided yet) and return a subscription made with the server's key — re-made when the key changed. */
export async function ensureSubscription(publicKey: string): Promise<PushSubscription> {
  const permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
  if (permission !== 'granted') throw new Error(permission === 'denied' ? 'Notifications are blocked for this site — allow them in the browser’s site settings, then try again.' : 'Notification permission was not granted.');
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    if (keyOf(existing) === publicKey) return existing;
    await existing.unsubscribe();
  }
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) as BufferSource });
}

export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== 'ok') return null;
  try { return await (await navigator.serviceWorker.ready).pushManager.getSubscription(); } catch { return null; }
}

export async function dropSubscription(): Promise<void> {
  const sub = await currentSubscription();
  if (sub) await sub.unsubscribe();
}
