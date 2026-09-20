/** Keeps the reminder service's copy of this device's record current: whenever the routine, the times or the day filter
 * change (or the app comes back to the foreground in a new week), the record is rebuilt and re-sent if its fingerprint
 * moved or the last sync is a day old. Runs only while push is on for this device. */
import { useEffect } from 'react';
import type { Step } from '../model';
import { recordHash, reminderRecord } from './payload';
import { currentSubscription, putRecord, toJson } from './push';
import { reminderSettings, setPush, useReminders } from './store';

const RESYNC_AFTER_MS = 24 * 60 * 60 * 1000;
const DEBOUNCE_MS = 1200;

export async function syncNow(steps: Step[], force = false): Promise<'sent' | 'unchanged' | 'off' | 'error'> {
  const settings = reminderSettings();
  if (!settings.push.endpoint) return 'off';
  const sub = await currentSubscription();
  if (!sub) {
    setPush({ lastError: 'The browser dropped this device’s push subscription. Turn notifications on again.' });
    return 'error';
  }
  const record = reminderRecord(steps, settings, toJson(sub));
  const hash = recordHash(record);
  const fresh = settings.push.syncedAt !== null && Date.now() - settings.push.syncedAt < RESYNC_AFTER_MS;
  if (!force && hash === settings.push.syncedHash && fresh) return 'unchanged';
  try {
    const res = await putRecord(record);
    setPush({ endpoint: record.subscription.endpoint, publicKey: res.publicKey, syncedAt: Date.now(), syncedHash: hash, lastError: null });
    return 'sent';
  } catch (e) {
    setPush({ lastError: e instanceof Error ? e.message : String(e) });
    return 'error';
  }
}

export function useReminderSync(steps: Step[]) {
  const settings = useReminders();
  const { endpoint } = settings.push;
  const { slots, onlyRoutineDays } = settings;
  useEffect(() => {
    if (!endpoint) return;
    let timer: ReturnType<typeof setTimeout> | null = setTimeout(() => { timer = null; void syncNow(steps); }, DEBOUNCE_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') void syncNow(steps); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [steps, endpoint, slots, onlyRoutineDays]);
}
