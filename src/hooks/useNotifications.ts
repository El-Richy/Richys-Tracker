import { useCallback } from 'react';
import type { Habit, Task } from '../types';

// Almacén global de timeouts para persistencia entre re-renders del hook
const activeTimeouts = new Map<string, number[]>();

export function useNotifications() {
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const clearHabitReminders = useCallback((habitId: string) => {
    const timeouts = activeTimeouts.get(habitId);
    if (timeouts) {
      timeouts.forEach((id) => window.clearTimeout(id));
      activeTimeouts.delete(habitId);
    }
  }, []);

  const clearAllReminders = useCallback(() => {
    activeTimeouts.forEach((timeouts) => {
      timeouts.forEach((id) => window.clearTimeout(id));
    });
    activeTimeouts.clear();
  }, []);

  const addTimeout = useCallback((habitId: string, timeoutId: number) => {
    const current = activeTimeouts.get(habitId) ?? [];
    activeTimeouts.set(habitId, [...current, timeoutId]);
  }, []);

  const scheduleHabitReminder = useCallback((habit: Habit) => {
    if (!habit.recordatorioHora || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Limpiar programaciones previas para este hábito antes de crear una nueva
    clearHabitReminders(habit.id);

    const [hours, minutes] = habit.recordatorioHora.split(':').map(Number);
    const now = new Date();
    const targetTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0
    );

    let msUntilReminder = targetTime.getTime() - now.getTime();
    if (msUntilReminder < 0) {
      // Si la hora ya pasó, programar para mañana (+24h)
      msUntilReminder += 24 * 60 * 60 * 1000;
    }

    const timeoutId = window.setTimeout(() => {
      new Notification("Richy's Tracker", {
        body: `⏰ Es hora de: ${habit.nombre}`,
        icon: '/favicon.svg',
      });
      
      // Reprogramar para el día siguiente al dispararse
      scheduleHabitReminder(habit);
    }, msUntilReminder);

    addTimeout(habit.id, timeoutId);
  }, [addTimeout, clearHabitReminders]);

  const scheduleRiskReminder = useCallback((habit: Habit, streakActual: number) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    if (streakActual <= 0) return;

    const now = new Date();
    // Programar para las 22:00 (2 horas antes de medianoche)
    const targetTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      22,
      0,
      0,
      0
    );

    const msUntilReminder = targetTime.getTime() - now.getTime();
    // Si ya pasaron las 22:00, no programar para hoy
    if (msUntilReminder < 0) return;

    const timeoutId = window.setTimeout(() => {
      new Notification("Richy's Tracker", {
        body: `⚠️ Tu racha de ${habit.nombre} termina hoy`,
        icon: '/favicon.svg',
      });
    }, msUntilReminder);

    addTimeout(habit.id, timeoutId);
  }, [addTimeout]);

  const clearTaskReminders = useCallback((taskId: string) => {
    const timeouts = activeTimeouts.get(taskId);
    if (timeouts) {
      timeouts.forEach((id) => window.clearTimeout(id));
      activeTimeouts.delete(taskId);
    }
  }, []);

  const scheduleTaskReminder = useCallback((task: Task) => {
    if (!task.recordatorioHora || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (task.completada) return;

    clearTaskReminders(task.id);

    const [hours, minutes] = task.recordatorioHora.split(':').map(Number);
    const now = new Date();
    const targetTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0
    );

    let msUntilReminder = targetTime.getTime() - now.getTime();
    if (msUntilReminder < 0) {
      // Si ya pasó hoy, programar para mañana
      msUntilReminder += 24 * 60 * 60 * 1000;
    }

    const timeoutId = window.setTimeout(() => {
      new Notification("Richy's Tracker", {
        body: `📌 Recordatorio de tarea: ${task.titulo}`,
        icon: '/favicon.svg',
      });
      // Reprogramar para mañana si no se ha completado
      scheduleTaskReminder(task);
    }, msUntilReminder);

    addTimeout(task.id, timeoutId);
  }, [addTimeout, clearTaskReminders]);

  // Cleanup automático al desmontar (opcional, pero útil si el hook se usa a nivel de página)
  // Nota: Dado que se usa en múltiples componentes, el cleanup global podría ser contraproducente.
  // Sin embargo, aseguramos que scheduleHabitReminder limpie los previos del mismo ID.

  return {
    requestPermission,
    scheduleHabitReminder,
    scheduleTaskReminder,
    scheduleRiskReminder,
    clearHabitReminders,
    clearTaskReminders,
    clearAllReminders,
  };
}
