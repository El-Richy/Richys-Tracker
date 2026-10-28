import { Capacitor, registerPlugin } from '@capacitor/core';

interface ReminderPlugin {
  requestAndSchedule(options: {
    id: number;
    title: string;
    body: string;
    hour: number;
    minute: number;
    confirm: boolean;
  }): Promise<{ ok: boolean; exact?: boolean; reason?: string }>;
  cancel(options: { id: number }): Promise<void>;
  cancelAll(): Promise<void>;
}

const Reminder = registerPlugin<ReminderPlugin>('Reminder');

function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

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

let nativeScheduleQueue: Promise<void> = Promise.resolve();

function enqueueNativeSchedule(work: () => Promise<void>): Promise<void> {
  const run = nativeScheduleQueue.then(work, work);
  nativeScheduleQueue = run.then(() => undefined, () => undefined);
  return run;
}

async function nativeSchedule(
  id: number,
  title: string,
  body: string,
  hour: number,
  minute: number,
  reportFailure: boolean,
): Promise<void> {
  try {
    await enqueueNativeSchedule(async () => {
      const result = await Reminder.requestAndSchedule({
        id,
        title,
        body,
        hour,
        minute,
        confirm: reportFailure,
      });
      if (result.ok) return;
      if (reportFailure) {
        if (result.reason === 'notifications') {
          alert('Para que el recordatorio suene, aceptá las notificaciones de Richy\'s Tracker.');
        } else {
          alert('No se pudo activar el recordatorio. Revisá que las notificaciones y las alarmas estén permitidas.');
        }
      }
    });
  } catch (error) {
    console.error('[notifications] Failed to schedule native reminder', error);
    if (reportFailure) {
      alert('No se pudo activar el recordatorio. Revisá que las notificaciones y las alarmas estén permitidas.');
    }
  }
}

async function nativeCancel(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  await enqueueNativeSchedule(async () => {
    try {
      await Promise.all(ids.map((id) => Reminder.cancel({ id })));
    } catch (error) {
      console.error('[notifications] Failed to cancel native reminders', error);
    }
  });
}

async function nativeCancelAll(): Promise<void> {
  await enqueueNativeSchedule(async () => {
    try {
      await Reminder.cancelAll();
    } catch (error) {
      console.error('[notifications] Failed to cancel all native reminders', error);
    }
  });
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

export function notificationBlockReason(): string | null {
  if (isNativePlatform()) return null;
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'En el navegador, las notificaciones solo funcionan por HTTPS. Esta dirección HTTP no puede enviarlas. La app Android sí.';
  }
  if (typeof Notification === 'undefined') {
    return 'Este navegador no puede mostrar notificaciones.';
  }
  return null;
}

async function ensureCanSchedule(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export async function scheduleHabitReminder(
  habitId: string,
  habitName: string,
  hora: string,
  reportFailure = false,
): Promise<void> {
  const parsed = parseHourMinute(hora);
  if (!parsed) return;
  if (isNativePlatform()) {
    await nativeSchedule(hashId(habitId, HABIT_PREFIX), "Richy's Tracker", `⏰ Es hora de: ${habitName}`, parsed.hour, parsed.minute, reportFailure);
    return;
  }
  if (!(await ensureCanSchedule())) return;
  webSchedule(habitId, parsed.hour, parsed.minute, `⏰ Es hora de: ${habitName}`);
}

export async function scheduleTaskReminder(
  taskId: string,
  taskTitle: string,
  hora: string,
  reportFailure = false,
): Promise<void> {
  const parsed = parseHourMinute(hora);
  if (!parsed) return;
  if (isNativePlatform()) {
    await nativeSchedule(hashId(taskId, TASK_PREFIX), "Richy's Tracker", `📌 ${taskTitle}`, parsed.hour, parsed.minute, reportFailure);
    return;
  }
  if (!(await ensureCanSchedule())) return;
  webSchedule(taskId, parsed.hour, parsed.minute, `📌 ${taskTitle}`);
}

export async function scheduleRiskReminder(
  habitId: string,
  habitName: string,
): Promise<void> {
  if (isNativePlatform()) {
    await nativeSchedule(hashId(habitId + ':risk', RISK_PREFIX), "Richy's Tracker", `⚠️ Tu racha de ${habitName} termina hoy`, 22, 0, false);
    return;
  }
  if (!(await ensureCanSchedule())) return;
  webSchedule(habitId + ':risk', 22, 0, `⚠️ Tu racha de ${habitName} termina hoy`);
}

export async function cancelReminders(id: string): Promise<void> {
  if (isNativePlatform()) {
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
  if (isNativePlatform()) {
    await nativeCancelAll();
  } else {
    cancelAllWebTimeouts();
  }
}

