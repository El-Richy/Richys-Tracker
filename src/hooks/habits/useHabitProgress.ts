import { useCallback, useRef } from 'react';
import { useHabitStore } from '../../store';
import { db } from '../../db';
import { getLocalDateStr } from '../../utils/dateUtils';
import { generateId } from '../../utils/idUtils';

interface ProgressOptions {
  onPostCheck: (habitId: string, completado: boolean, fecha?: string) => Promise<void>;
}

export function useHabitProgress({ onPostCheck }: ProgressOptions) {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const setLogs = useHabitStore((s) => s.setLogs);
  const updateHabitStore = useHabitStore((s) => s.updateHabit);
  const today = getLocalDateStr();
  const inFlight = useRef(new Set<string>());

  const toggleCheck = useCallback(async (habitId: string, fecha?: string) => {
    const targetDate = fecha || today;
    const lockKey = `${habitId}:${targetDate}`;
    if (inFlight.current.has(lockKey)) return;
    inFlight.current.add(lockKey);
    try {
      const existing = logs.find(l => l.habitId === habitId && l.fecha === targetDate);
      const log = existing
        ? {
            ...existing,
            completado: !existing.completado,
            timestamp: new Date().toISOString(),
          }
        : {
            id: generateId(),
            habitId,
            fecha: targetDate,
            completado: true,
            subtareasCompletadas: [],
            timestamp: new Date().toISOString(),
          };

      await db.habitLogs.put(log);
      setLogs([...logs.filter(l => l.id !== log.id), log]);
      await onPostCheck(habitId, log.completado, targetDate);
    } finally {
      inFlight.current.delete(lockKey);
    }
  }, [logs, setLogs, onPostCheck, today]);

  const toggleSubtask = useCallback(async (habitId: string, subtaskId: string, fecha?: string) => {
    const targetDate = fecha || today;
    const lockKey = `${habitId}:${targetDate}:sub`;
    if (inFlight.current.has(lockKey)) return;
    inFlight.current.add(lockKey);
    try {
      const existing = logs.find(l => l.habitId === habitId && l.fecha === targetDate);
      const current = existing?.subtareasCompletadas || [];
      const updated = current.includes(subtaskId)
        ? current.filter(id => id !== subtaskId)
        : [...current, subtaskId];

      const habit = habits.find(h => h.id === habitId);
      const completado = habit && habit.subtareas.length > 0
        ? habit.subtareas.every(s => updated.includes(s.id))
        : existing?.completado ?? false;

      const log = {
        id: existing?.id ?? generateId(),
        habitId,
        fecha: targetDate,
        completado,
        subtareasCompletadas: updated,
        timestamp: new Date().toISOString(),
        razonFallo: existing?.razonFallo,
      };

      await db.habitLogs.put(log);
      setLogs([...logs.filter(l => l.id !== log.id), log]);
      await onPostCheck(habitId, log.completado, targetDate);
    } finally {
      inFlight.current.delete(lockKey);
    }
  }, [logs, habits, setLogs, onPostCheck, today]);

  const addSubtask = useCallback(async (habitId: string, subtaskName: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const newSub = { id: generateId(), nombre: subtaskName };
    const updated = [...habit.subtareas, newSub];

    await db.habits.update(habitId, { subtareas: updated });
    updateHabitStore(habitId, { subtareas: updated });
  }, [habits, updateHabitStore]);

  return { toggleCheck, toggleSubtask, addSubtask };
}
