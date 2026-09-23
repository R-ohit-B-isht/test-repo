import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlarmClock, BellRing, CalendarPlus, Check, Loader2, Lock, Send } from 'lucide-react';
import { DAYS, SLOT_LABEL, SLOTS, type Slot, type Step } from '../../../schedule/model';
import { buildIcs, daysWithSteps, downloadIcs } from '../../../schedule/reminders/ics';
import { deviceTimeZone } from '../../../schedule/reminders/payload';
import { currentSubscription, dropSubscription, ensureSubscription, permissionNow, pushSupport, sendTest, serverConfig, SUPPORT_TEXT, unsubscribeServer, type ServerConfig } from '../../../schedule/reminders/push';
import { anyEnabled, clearPush, setOnlyRoutineDays, setPush, setSlotEnabled, setSlotTime, useReminders } from '../../../schedule/reminders/store';
import { syncNow } from '../../../schedule/reminders/useReminderSync';

const DAY_SHORT: Record<(typeof DAYS)[number], string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60_000);
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 60 * 24 ? `${Math.round(m / 60)} h ago` : new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
};
const clock = (t: string) => new Date(`2000-01-01T${t}:00`).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

type Server = { state: 'checking' } | { state: 'off' } | { state: 'on'; config: ServerConfig };

/** Morning / night reminders for this device. Times and on/off live in `ledger.routine.reminders.v1`, never in the routine;
 * the push service only ever receives step names + times. Two honest paths: phone notifications (needs a push service and
 * permission) and a phone-clock calendar file that needs neither. */
export function RemindersPanel({ steps }: { steps: Step[] }) {
  const settings = useReminders();
  const support = pushSupport();
  const [permission, setPermission] = useState(permissionNow);
  const [server, setServer] = useState<Server>({ state: 'checking' });
  const [busy, setBusy] = useState<'on' | 'off' | 'test' | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const enabled = anyEnabled(settings);
  const pushOn = settings.push.endpoint !== null;
  const tz = useMemo(() => deviceTimeZone(), []);

  useEffect(() => {
    let alive = true;
    void serverConfig().then((cfg) => { if (alive) setServer(cfg ? { state: 'on', config: cfg } : { state: 'off' }); });
    return () => { alive = false; };
  }, []);

  // A subscription the browser has forgotten (cleared site data, reinstall) must not keep showing as "on".
  useEffect(() => {
    if (!pushOn || support !== 'ok') return;
    void currentSubscription().then((sub) => { if (!sub || sub.endpoint !== settings.push.endpoint) clearPush(); });
  }, [pushOn, support, settings.push.endpoint]);

  const turnOn = useCallback(async () => {
    if (server.state !== 'on') return;
    setBusy('on'); setFlash(null);
    try {
      const sub = await ensureSubscription(server.config.publicKey);
      setPermission(permissionNow());
      setPush({ endpoint: sub.endpoint, publicKey: server.config.publicKey, syncedHash: null, syncedAt: null, lastError: null });
      const r = await syncNow(steps, true);
      if (r === 'sent') setFlash('Notifications are on for this device.');
    } catch (e) {
      setPermission(permissionNow());
      setPush({ lastError: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(null); }
  }, [server, steps]);

  const turnOff = useCallback(async () => {
    setBusy('off'); setFlash(null);
    const endpoint = settings.push.endpoint;
    try {
      if (endpoint) await unsubscribeServer(endpoint).catch(() => undefined);
      await dropSubscription();
    } finally {
      clearPush();
      setBusy(null);
      setFlash('Notifications are off for this device. Times are kept.');
    }
  }, [settings.push.endpoint]);

  const test = useCallback(async (slot: Slot) => {
    if (!settings.push.endpoint) return;
    setBusy('test'); setFlash(null);
    try {
      await syncNow(steps);
      await sendTest(settings.push.endpoint, slot);
      setFlash(`Test ${SLOT_LABEL[slot].toLowerCase()} notification sent — it should appear within a few seconds.`);
    } catch (e) {
      setPush({ lastError: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(null); }
  }, [settings.push.endpoint, steps]);

  const exportIcs = () => downloadIcs(buildIcs(steps, settings, new Date(), tz));

  return (
    <section aria-label="Reminders" className="space-y-5">
      <div>
        <p className="label">Reminders</p>
        <h3 className="mt-1 text-[22px] leading-tight text-display sm:text-[26px]">A nudge at your times.</h3>
        <p className="mt-1 flex items-start gap-1.5 text-[13px] text-secondary"><Lock size={12} className="mt-1 shrink-0" aria-hidden />Per device. Only step names and times ever leave this phone — never your notes or products’ evidence.</p>
      </div>

      <ul className="space-y-3" aria-label="Reminder times">
        {SLOTS.map((slot) => <SlotRow key={slot} slot={slot} steps={steps} settings={settings.slots[slot]} onlyRoutineDays={settings.onlyRoutineDays} />)}
      </ul>

      <button type="button" role="switch" aria-checked={settings.onlyRoutineDays} onClick={() => setOnlyRoutineDays(!settings.onlyRoutineDays)} className="switch-row press w-full">
        <span className="min-w-0">
          <span className="block text-[13px] font-bold text-display">Only on days with steps</span>
          <span className="block text-[11.5px] text-secondary">{settings.onlyRoutineDays ? 'Quiet when a slot has nothing scheduled' : 'Rings every day, even when the slot is empty'}</span>
        </span>
        <span className="switch" aria-hidden />
      </button>

      <div className="card space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised text-display"><BellRing size={16} aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h4 className="text-[15px] font-extrabold text-display">Phone notifications</h4>
            <p className="mt-0.5 text-[13px] text-secondary">Sent by the Ledger’s reminder service at your times with today’s steps, even when the app is closed. Tap one to open that routine.</p>
          </div>
        </div>
        <PushStatus support={support} permission={permission} server={server} pushOn={pushOn} syncedAt={settings.push.syncedAt} lastError={settings.push.lastError} enabled={enabled} tz={tz} />
        <div className="flex flex-wrap gap-2">
          {!pushOn && support === 'ok' && server.state === 'on' && permission !== 'denied' && (
            <button type="button" className="btn btn-accent" onClick={() => void turnOn()} disabled={busy !== null}>
              {busy === 'on' ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <BellRing size={14} aria-hidden />}Turn on notifications
            </button>
          )}
          {pushOn && (
            <>
              <button type="button" className="btn" onClick={() => void test(settings.slots.pm.enabled && !settings.slots.am.enabled ? 'pm' : 'am')} disabled={busy !== null}>
                {busy === 'test' ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Send size={14} aria-hidden />}Send a test
              </button>
              <button type="button" className="btn" onClick={() => void turnOff()} disabled={busy !== null}>
                {busy === 'off' ? <Loader2 size={14} className="animate-spin" aria-hidden /> : null}Turn off on this device
              </button>
            </>
          )}
        </div>
        {flash && <p className="flex items-center gap-1.5 text-[13px] font-semibold text-display" role="status"><Check size={13} aria-hidden />{flash}</p>}
      </div>

      <div className="card space-y-3 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised text-display"><AlarmClock size={16} aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h4 className="text-[15px] font-extrabold text-display">Phone alarm via calendar</h4>
            <p className="mt-0.5 text-[13px] text-secondary">
              Downloads a small calendar file with a repeating, alarmed event for each reminder above. Open it and your phone’s calendar rings at those times with no dependence on this site or on notification permission. Re-import after changing a time.
            </p>
          </div>
        </div>
        <button type="button" className="btn" onClick={exportIcs} disabled={!enabled}><CalendarPlus size={14} aria-hidden />Add to phone calendar</button>
        {!enabled && <p className="text-[12.5px] text-secondary">Switch on Morning or Night above first.</p>}
      </div>
    </section>
  );
}

function SlotRow({ slot, steps, settings, onlyRoutineDays }: { slot: Slot; steps: Step[]; settings: { enabled: boolean; time: string }; onlyRoutineDays: boolean }) {
  const days = daysWithSteps(steps, slot);
  const every = days.length === DAYS.length;
  const id = `remind-${slot}`;
  const when = !onlyRoutineDays || every ? 'every day' : days.length === 0 ? 'no steps scheduled — nothing will ring' : days.map((d) => DAY_SHORT[d]).join(' · ');
  return (
    <li className="card flex flex-wrap items-center gap-3 p-3 sm:p-4">
      <button type="button" role="switch" aria-checked={settings.enabled} aria-labelledby={`${id}-label`} aria-describedby={`${id}-hint`} onClick={() => setSlotEnabled(slot, !settings.enabled)} className="switch-row press min-w-0 flex-1 border-0 p-0">
        <span className="min-w-0">
          <span id={`${id}-label`} className="block text-[15px] font-extrabold text-display">{SLOT_LABEL[slot]}</span>
          <span id={`${id}-hint`} className="block text-[12px] text-secondary">{settings.enabled ? `${clock(settings.time)} · ${when}` : 'Off'}</span>
        </span>
        <span className="switch" aria-hidden />
      </button>
      <label className="flex items-center gap-2 text-[12.5px] font-bold text-secondary">
        <span className="sr-only">{SLOT_LABEL[slot]} reminder time</span>
        <input type="time" value={settings.time} step={300} onChange={(e) => { if (e.target.value) setSlotTime(slot, e.target.value); }} aria-label={`${SLOT_LABEL[slot]} reminder time`} className="field h-10 w-[7.5rem] text-[14px] font-bold text-display" disabled={!settings.enabled} />
      </label>
    </li>
  );
}

function PushStatus({ support, permission, server, pushOn, syncedAt, lastError, enabled, tz }: { support: ReturnType<typeof pushSupport>; permission: NotificationPermission; server: Server; pushOn: boolean; syncedAt: number | null; lastError: string | null; enabled: boolean; tz: string }) {
  let text: string;
  let tone: 'ok' | 'warn' | 'muted' = 'muted';
  if (support !== 'ok') { text = SUPPORT_TEXT[support]; tone = 'warn'; }
  else if (server.state === 'checking') text = 'Checking the reminder service…';
  else if (server.state === 'off') { text = 'The reminder service isn’t reachable from this deployment, so push can’t be switched on here. The calendar alarm below works regardless.'; tone = 'warn'; }
  else if (permission === 'denied' && !pushOn) { text = 'Notifications are blocked for this site. Allow them in the browser’s site settings (or the app’s notification settings on Android), then come back.'; tone = 'warn'; }
  else if (pushOn) {
    text = `On for this device · ${tz}${syncedAt ? ` · synced ${ago(syncedAt)}` : ' · not synced yet'}${enabled ? '' : ' · both reminders are switched off above, so nothing will be sent'}`;
    tone = enabled ? 'ok' : 'warn';
  } else text = 'Off. Turning on asks the browser for notification permission once.';
  return (
    <div className="space-y-1">
      <p className={`text-[13px] ${tone === 'warn' ? 'text-primary' : tone === 'ok' ? 'font-semibold text-display' : 'text-secondary'}`} role="status">{text}</p>
      {lastError && <p className="rounded-[12px] border border-warning/40 bg-warning/10 px-3 py-2 text-[12.5px] text-primary">{lastError}</p>}
    </div>
  );
}
