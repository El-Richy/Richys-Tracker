import { useCallback } from 'react';
import { useHabitStore, useAuthStore } from '../../store';
import { db } from '../../db';
import type { Habit } from '../../types';
import { generateId } from '../../utils/idUtils';
import { scheduleHabitReminder, cancelReminders } from '../../lib/notifications';

export function useHabitActions() {
  const user = useAuthStore((s) => s.user);

  const addHabitToStore = useHabitStore((s) => s.addHabit);
  const updateHabitInStore = useHabitStore((s) => s.updateHabit);
  const removeHabitFromStore = useHabitStore((s) => s.removeHabit);

  const createHabit = useCallback(async (
    data: Pick<Habit, 'nombre' | 'color' | 'icono' | 'subtareas' | 'diasActivos' | 'diasGracia' | 'recordatorioHora' | 'prioridad'>
  ) => {
    if (!user) return;

    const habit: Habit = {
      id: generateId(),
      nombre: data.nombre,
      color: data.color,
      icono: data.icono,
      recordatorioHora: data.recordatorioHora ?? null,
      diasActivos: data.diasActivos,
      diasGracia: data.diasGracia,
      creadoEn: new Date().toISOString(),
      userId: user.id,
      subtareas: data.subtareas || [],
      prioridad: data.prioridad || 'media',
    };

    await db.habits.add(habit);
    addHabitToStore(habit);

    if (habit.recordatorioHora) {
      scheduleHabitReminder(habit.id, habit.nombre, habit.recordatorioHora);
    }

    return habit;
  }, [user, addHabitToStore]);

  const editHabit = useCallback(async (
    id: string,
    updates: Partial<Pick<Habit, 'nombre' | 'color' | 'icono' | 'subtareas' | 'diasActivos' | 'diasGracia' | 'recordatorioHora' | 'prioridad'>>
  ) => {
    await db.habits.update(id, updates);
    updateHabitInStore(id, updates);

    if (updates.recordatorioHora !== undefined) {
      cancelReminders(id);
      if (updates.recordatorioHora) {
        const habit = useHabitStore.getState().habits.find(h => h.id === id);
        if (habit) {
          scheduleHabitReminder(habit.id, habit.nombre, updates.recordatorioHora);
        }
      }
    }
  }, [updateHabitInStore]);

  const deleteHabit = useCallback(async (id: string) => {
    try {
      cancelReminders(id);
      await db.habits.delete(id);
      await db.habitLogs.where('habitId').equals(id).delete();
      await db.streaks.delete(id);
      await db.pointEntries.where({ habitId: id, origenTipo: 'habit' }).delete().catch(() => {});
      removeHabitFromStore(id);
    } catch (err) {
      console.error('Delete habit error:', err);
    }
  }, [removeHabitFromStore]);

  return { createHabit, editHabit, deleteHabit };
}
