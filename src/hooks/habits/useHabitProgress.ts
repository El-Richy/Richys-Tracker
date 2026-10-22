import { useCallback } from 'react';
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

  const toggleCheck = useCallback(async (habitId: string, fecha?: string) => {
    const targetDate = fecha || today;

    const log = logs.find(l => l.habitId === habitId && l.fecha === targetDate) || {
      id: generateId(),
      habitId,
      fecha: targetDate,
      completado: false,
      subtareasCompletadas: [],
      timestamp: new Date().toISOString()
    };

    log.completado = !log.completado;
    log.timestamp = new Date().toISOString();

    await db.habitLogs.put(log);
    setLogs([...logs.filter(l => l.id !== log.id), log]);

    await onPostCheck(habitId, log.completado, targetDate);
  }, [logs, setLogs, onPostCheck, today]);

  const toggleSubtask = useCallback(async (habitId: string, subtaskId: string, fecha?: string) => {
    const targetDate = fecha || today;

    const log = logs.find(l => l.habitId === habitId && l.fecha === targetDate) || {
      id: generateId(),
      habitId,
      fecha: targetDate,
      completado: false,
      subtareasCompletadas: [],
      timestamp: new Date().toISOString()
    };

    const current = log.subtareasCompletadas || [];
    const updated = current.includes(subtaskId)
      ? current.filter(id => id !== subtaskId)
      : [...current, subtaskId];

    log.subtareasCompletadas = updated;
    log.timestamp = new Date().toISOString();

    const habit = habits.find(h => h.id === habitId);
    if (habit && habit.subtareas.length > 0) {
      log.completado = habit.subtareas.every(s => updated.includes(s.id));
    }

    await db.habitLogs.put(log);
    setLogs([...logs.filter(l => l.id !== log.id), log]);

    await onPostCheck(habitId, log.completado, targetDate);
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
