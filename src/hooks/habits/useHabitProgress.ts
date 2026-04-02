import { useCallback } from 'react';
import { useHabitStore, useAuthStore } from '../../store';
import { db } from '../../db';
import { supabase } from '../../lib/supabase';
import { getLocalDateStr } from '../../utils/dateUtils';
import { generateId } from '../../utils/idUtils';

interface ProgressOptions {
  onPostCheck: (habitId: string, completado: boolean, fecha?: string) => Promise<void>;
}

/**
 * Hook responsable del progreso diario (checks y subtareas).
 */
export function useHabitProgress({ onPostCheck }: ProgressOptions) {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const setLogs = useHabitStore((s) => s.setLogs);
  const updateHabitStore = useHabitStore((s) => s.updateHabit);
  const user = useAuthStore((s) => s.user);
  const today = getLocalDateStr();

  /**
   * Marcar o desmarcar un hábito.
   */
  const toggleCheck = useCallback(async (habitId: string, fecha?: string) => {
    const targetDate = fecha || today;
    
    // 1. Obtener estado actual
    const log = logs.find(l => l.habitId === habitId && l.fecha === targetDate) || {
      id: generateId(),
      habitId,
      fecha: targetDate,
      completado: false,
      subtareasCompletadas: [],
      timestamp: new Date().toISOString()
    };

    // 2. Invertir estado
    log.completado = !log.completado;
    log.timestamp = new Date().toISOString();

    // Actualizar localmente (Optimista)
    await db.habitLogs.put(log);
    setLogs([...logs.filter(l => l.id !== log.id), log]);

    // 3. Supabase Sync (Background)
    supabase.from('habit_logs').upsert({
      id: log.id,
      habit_id: log.habitId,
      user_id: user?.id,
      fecha: log.fecha,
      completado: log.completado,
      subtareas_completadas: log.subtareasCompletadas,
      timestamp: log.timestamp
    }).then(({ error }) => {
      if (error) console.error('Sync toggle check error:', error.message);
    });

    // 4. Disparar efectos secundarios
    await onPostCheck(habitId, log.completado, targetDate);
  }, [logs, user?.id, setLogs, onPostCheck, today]);

  /**
   * Marcar o desmarcar una subtarea.
   */
  const toggleSubtask = useCallback(async (habitId: string, subtaskId: string, fecha?: string) => {
    const targetDate = fecha || today;
    
    // 1. Obtener log
    const log = logs.find(l => l.habitId === habitId && l.fecha === targetDate) || {
      id: generateId(),
      habitId,
      fecha: targetDate,
      completado: false,
      subtareasCompletadas: [],
      timestamp: new Date().toISOString()
    };

    // 2. Toggle subtarea
    const current = log.subtareasCompletadas || [];
    const updated = current.includes(subtaskId)
      ? current.filter(id => id !== subtaskId)
      : [...current, subtaskId];
    
    log.subtareasCompletadas = updated;
    log.timestamp = new Date().toISOString();

    // 3. Auto-completar hábito si todas las subtareas están listas
    const habit = habits.find(h => h.id === habitId);
    if (habit && habit.subtareas.length > 0) {
      log.completado = habit.subtareas.every(s => updated.includes(s.id));
    }

    // Actualizar localmente
    await db.habitLogs.put(log);
    setLogs([...logs.filter(l => l.id !== log.id), log]);

    // Supabase Sync
    supabase.from('habit_logs').upsert({
      id: log.id,
      habit_id: log.habitId,
      user_id: user?.id,
      fecha: log.fecha,
      completado: log.completado,
      subtareas_completadas: log.subtareasCompletadas,
      timestamp: log.timestamp
    }).then(({ error }) => {
      if (error) console.error('Sync toggle subtask error:', error.message);
    });

    // 4. Disparar efectos secundarios (Si cambió el estado completado)
    await onPostCheck(habitId, log.completado, targetDate);
  }, [logs, habits, user?.id, setLogs, onPostCheck, today]);

  /**
   * Añadir subtarea al vuelo.
   */
  const addSubtask = useCallback(async (habitId: string, subtaskName: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const newSub = { id: generateId(), nombre: subtaskName };
    const updated = [...habit.subtareas, newSub];

    await db.habits.update(habitId, { subtareas: updated });
    updateHabitStore(habitId, { subtareas: updated });

    supabase.from('habits').update({ subtareas: updated }).eq('id', habitId)
      .then(({ error }) => {
        if (error) console.error('Sync add subtask error:', error.message);
      });
  }, [habits, updateHabitStore]);

  return { toggleCheck, toggleSubtask, addSubtask };
}
