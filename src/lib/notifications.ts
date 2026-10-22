import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

/**
 * FNV-1a hash del UUID (32 bits) reducido a un espacio de 90 000 valores
 * por prefijo.  Prefijo:
 *   1xxx → hábito,  2xxx → tarea,  3xxx → riesgo (racha en peligro)
 */
function hashId(uuid: string, prefix: number): number {
  let hash = 2166136261; // FNV-1a offset basis
  for (let i = 0; i < uuid.length; i++) {
    hash ^= uuid.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const num = ((hash >>> 0) % 90000);
  return prefix * 100000 + num;
}

const HABIT_PREFIX = 1;
const TASK_PREFIX = 2;
const RISK_PREFIX = 3;

// ── Android (Capacitor) ──────────────────────────────────

let _LocalNotifications: typeof import('@capacitor/local-notifications')['LocalNotifications'] | null = null;

async function getLocalNotifications() {
  if (!_LocalNotifications) {
    const mod = await import('@capacitor/local-notifications');
    _LocalNotifications = mod.LocalNotifications;
  }
  return _LocalNotifications;
}

async function nativeSchedule(
  id: number,
  title: string,
  body: string,
  hour: number,
  minute: number,
): Promise<void> {
  try {
    const LN = await getLocalNotifications();
    await LN.schedule({
      notifications: [
        {
          id,
          title,
          body,
          autoCancel: true,
          schedule: {
            on: { hour, minute },
            allowWhileIdle: true,
          },
        },
      ],
    });
  } catch (error) {
    console.error('[notifications] Failed to schedule native reminder', error);
  }
}

async function nativeCancel(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  try {
    const LN = await getLocalNotifications();
    await LN.cancel({ notifications: ids.map((id) => ({ id })) });
  } catch (error) {
    console.error('[notifications] Failed to cancel native reminders', error);
  }
}

async function nativeCancelAll(): Promise<void> {
  try {
    const LN = await getLocalNotifications();
    const pending = await LN.getPending();
    if (pending.notifications.length > 0) {
      await LN.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }
  } catch (error) {
    console.error('[notifications] Failed to cancel all native reminders', error);
  }
}

async function clearDeliveredNotifications(): Promise<void> {
  try {
    const LN = await getLocalNotifications();
    await LN.removeAllDeliveredNotifications();
  } catch (error) {
    console.error('[notifications] Failed to clear delivered notifications', error);
  }
}

// ── Web (setTimeout + Notification API) ─────────────────

const activeWebTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function webSchedule(
  key: string,
  hour: number,
  minute: number,
  body: string,
): void {
  if (typeof Notification === 'undefined') return;
  cancelWebTimeout(key);
  const now = new Date();
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0,
  );
  let ms = target.getTime() - now.getTime();
  if (ms < 0) ms += 24 * 60 * 60 * 1000;

  const timer = setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification("Richy's Tracker", { body, icon: '/favicon.svg' });
    }
    webSchedule(key, hour, minute, body);
  }, ms);
  activeWebTimeouts.set(key, timer);
}

function cancelWebTimeout(key: string): void {
  const t = activeWebTimeouts.get(key);
  if (t) {
    clearTimeout(t);
    activeWebTimeouts.delete(key);
  }
}

function cancelAllWebTimeouts(): void {
  activeWebTimeouts.forEach((t) => clearTimeout(t));
  activeWebTimeouts.clear();
}

function parseHourMinute(hora: string): { hour: number; minute: number } | null {
  const [h, m] = hora.split(':').map(Number);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { hour: h, minute: m };
}

// ── API pública ─────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative) {
    try {
      const LN = await getLocalNotifications();
      let status = await LN.checkPermissions();
      if (status.display !== 'granted') {
        status = await LN.requestPermissions();
      }
      return status.display === 'granted';
    } catch (error) {
      console.error('[notifications] Failed to request native permission', error);
      return false;
    }
  }

  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

async function ensureCanSchedule(): Promise<boolean> {
  return requestNotificationPermission();
}

export async function scheduleHabitReminder(
  habitId: string,
  habitName: string,
  hora: string,
): Promise<void> {
  const parsed = parseHourMinute(hora);
  if (!parsed) return;
  if (!(await ensureCanSchedule())) return;
  if (isNative) {
    await nativeSchedule(hashId(habitId, HABIT_PREFIX), "Richy's Tracker", `⏰ Es hora de: ${habitName}`, parsed.hour, parsed.minute);
  } else {
    webSchedule(habitId, parsed.hour, parsed.minute, `⏰ Es hora de: ${habitName}`);
  }
}

export async function scheduleTaskReminder(
  taskId: string,
  taskTitle: string,
  hora: string,
): Promise<void> {
  const parsed = parseHourMinute(hora);
  if (!parsed) return;
  if (!(await ensureCanSchedule())) return;
  if (isNative) {
    await nativeSchedule(hashId(taskId, TASK_PREFIX), "Richy's Tracker", `📌 ${taskTitle}`, parsed.hour, parsed.minute);
  } else {
    webSchedule(taskId, parsed.hour, parsed.minute, `📌 ${taskTitle}`);
  }
}

export async function scheduleRiskReminder(
  habitId: string,
  habitName: string,
): Promise<void> {
  if (!(await ensureCanSchedule())) return;
  if (isNative) {
    await nativeSchedule(hashId(habitId + ':risk', RISK_PREFIX), "Richy's Tracker", `⚠️ Tu racha de ${habitName} termina hoy`, 22, 0);
  } else {
    webSchedule(habitId + ':risk', 22, 0, `⚠️ Tu racha de ${habitName} termina hoy`);
  }
}

export async function cancelReminders(id: string): Promise<void> {
  if (isNative) {
    await nativeCancel([
      hashId(id, HABIT_PREFIX),
      hashId(id, TASK_PREFIX),
      hashId(id + ':risk', RISK_PREFIX),
    ]);
  } else {
    cancelWebTimeout(id);
    cancelWebTimeout(id + ':risk');
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (isNative) {
    await nativeCancelAll();
  } else {
    cancelAllWebTimeouts();
  }
}

/**
 * Clears the launcher badge / notification tray on launch and whenever
 * the app returns to the foreground. Web is a no-op.
 */
export function startNotificationLifecycle(): () => void {
  if (!isNative) return () => {};

  let cancelled = false;
  let handle: PluginListenerHandle | undefined;

  void (async () => {
    await clearDeliveredNotifications();
    if (cancelled) return;
    try {
      const { App } = await import('@capacitor/app');
      handle = await App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          void clearDeliveredNotifications();
        }
      });
      if (cancelled) {
        await handle.remove();
        handle = undefined;
      }
    } catch (error) {
      console.error('[notifications] Failed to start notification lifecycle', error);
    }
  })();

  return () => {
    cancelled = true;
    if (handle) {
      void handle.remove();
      handle = undefined;
    }
  };
}
