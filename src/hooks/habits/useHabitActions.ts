import { useCallback } from 'react';
import { useHabitStore, useAuthStore } from '../../store';
import { db } from '../../db';
import { supabase } from '../../lib/supabase';
import type { Habit } from '../../types';
import { generateId } from '../../utils/idUtils';
import { useNotifications } from '../useNotifications';

/**
 * Hook responsable de las mutaciones estructurales de los hábitos (CRUD).
 */
export function useHabitActions() {
  const user = useAuthStore((s) => s.user);
  
  const addHabitToStore = useHabitStore((s) => s.addHabit);
  const updateHabitInStore = useHabitStore((s) => s.updateHabit);
  const removeHabitFromStore = useHabitStore((s) => s.removeHabit);
  
  const { scheduleHabitReminder, clearHabitReminders } = useNotifications();

  /**
   * Crear un nuevo hábito.
   */
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

    // 1. Dexie y Store (Optimista)
    await db.habits.add(habit);
    addHabitToStore(habit);
    scheduleHabitReminder(habit);

    // 2. Supabase en background
    supabase.from('habits').insert({
      id: habit.id,
      user_id: habit.userId,
      nombre: habit.nombre,
      color: habit.color,
      icono: habit.icono,
      recordatorio_hora: habit.recordatorioHora,
      dias_activos: habit.diasActivos,
      dias_gracia: habit.diasGracia,
      subtareas: habit.subtareas,
      creado_en: habit.creadoEn,
      prioridad: habit.prioridad,
    })
      .then(({ error }) => {
        if (error) console.error('Sync create habit error:', error.message);
      });

    return habit;
  }, [user, addHabitToStore, scheduleHabitReminder]);

  /**
   * Editar un hábito existente.
   */
  const editHabit = useCallback(async (
    id: string,
    updates: Partial<Pick<Habit, 'nombre' | 'color' | 'icono' | 'subtareas' | 'diasActivos' | 'diasGracia' | 'recordatorioHora' | 'prioridad'>>
  ) => {
    // 1. Dexie y Store
    await db.habits.update(id, updates);
    updateHabitInStore(id, updates);

    // Actualizar recordatorios
    const updatedHabit = useHabitStore.getState().habits.find((h) => h.id === id);
    if (updatedHabit) {
      clearHabitReminders(id);
      scheduleHabitReminder(updatedHabit);
    }

    // 2. Supabase en background
    const up: Record<string, unknown> = {};
    if (updates.nombre) up.nombre = updates.nombre;
    if (updates.color) up.color = updates.color;
    if (updates.icono) up.icono = updates.icono;
    if (updates.recordatorioHora !== undefined) up.recordatorio_hora = updates.recordatorioHora;
    if (updates.diasActivos) up.dias_activos = updates.diasActivos;
    if (updates.diasGracia !== undefined) up.dias_gracia = updates.diasGracia;
    if (updates.subtareas) up.subtareas = updates.subtareas;
    if (updates.prioridad !== undefined) up.prioridad = updates.prioridad;

    supabase.from('habits')
      .update(up)
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Sync update habit error:', error.message);
      });
  }, [updateHabitInStore, clearHabitReminders, scheduleHabitReminder]);

  /**
   * Eliminar un hábito y toda su metadata asociada.
   */
  const deleteHabit = useCallback(async (id: string) => {
    try {
      // 1. Dexie Delete (Limpieza profunda local inmediata)
      await db.habits.delete(id);
      clearHabitReminders(id);
      await db.habitLogs.where('habitId').equals(id).delete();
      await db.streaks.delete(id);
      
      // Intentar limpiar puntos asociados (pueden heredar de racha)
      await db.pointEntries.where('habitId').equals(id).delete().catch(() => {});
      
      // 2. Zustand Store Update
      removeHabitFromStore(id);

      // 3. Supabase en background
      supabase.from('habits').delete().eq('id', id)
        .then(({ error }) => {
          if (error) console.error('Supabase delete error:', error.message);
        });
      
    } catch (err) {
      console.error('Delete habit error:', err);
    }
  }, [removeHabitFromStore, clearHabitReminders]);

  return { createHabit, editHabit, deleteHabit };
}
