import { useMemo, useEffect } from 'react';
import { useHabitStore } from '../store';
import { useHabitSync } from './habits/useHabitSync';
import { useHabitActions } from './habits/useHabitActions';
import { useHabitProgress } from './habits/useHabitProgress';
import { useHabitImpact } from './habits/useHabitImpact';
import { getLocalDateStr } from '../utils/dateUtils';

/**
 * Hook Façade para CRUD de hábitos, checks diarios, rachas y puntos.
 * Consolida la lógica fragmentada en ganchos especializados para mantener
 * la compatibilidad con la interfaz pública original.
 */
export function useHabits() {
  // 1. Estado centralizado (Zustand)
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const streaks = useHabitStore((s) => s.streaks);
  const badges = useHabitStore((s) => s.badges);
  const pointEntries = useHabitStore((s) => s.pointEntries);
  const totalPoints = useHabitStore((s) => s.totalPoints);
  const isLoading = useHabitStore((s) => s.isLoading);

  // 2. Micro-Hooks Especializados
  const { refresh } = useHabitSync();
  const { createHabit, editHabit, deleteHabit } = useHabitActions();
  const { recalcularTodasLasRachas, procesarPostCheck, confirmBadgeSeen } = useHabitImpact();
  const { toggleCheck, toggleSubtask, addSubtask } = useHabitProgress({ onPostCheck: procesarPostCheck });

  // 3. Efectos automáticos (Rachas globales)
  useEffect(() => {
    if (habits.length > 0) {
      recalcularTodasLasRachas();
    }
  }, [habits.length, recalcularTodasLasRachas]);

  // 4. Helpers de UI / Selectores derivados
  const getLogForHabit = (habitId: string, fecha: string = getLocalDateStr()) => {
    return logs.find((l) => l.habitId === habitId && l.fecha === fecha);
  };

  const getStreakForHabit = (habitId: string) => {
    return streaks.find((s) => s.habitId === habitId);
  };

  const sortedHabits = useMemo(() => {
    const orden: Record<string, number> = { alta: 1, media: 2, baja: 3 };
    return [...habits].sort((a, b) => {
      const pA = orden[a.prioridad || 'media'] || 3;
      const pB = orden[b.prioridad || 'media'] || 3;
      if (pA !== pB) return pA - pB;
      const nDiff = (a.nombre || '').localeCompare(b.nombre || '');
      if (nDiff !== 0) return nDiff;
      return (a.id || '').localeCompare(b.id || '');
    });
  }, [habits]);

  // API Pública consolidada (Retrocompatible)
  return {
    habits,
    logs,
    streaks,
    badges,
    pointEntries,
    totalPoints,
    isLoading,
    sortedHabits,
    
    // Funciones
    createHabit,
    editHabit,
    deleteHabit,
    toggleCheck,
    toggleSubtask,
    addSubtask,
    getLogForHabit,
    getStreakForHabit,
    confirmBadgeSeen,
    refresh,
    recalcularTodasLasRachas
  };
}
