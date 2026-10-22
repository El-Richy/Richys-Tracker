import { useMemo, useEffect } from 'react';
import { useHabitStore } from '../store';
import { useHabitSync } from './habits/useHabitSync';
import { useHabitActions } from './habits/useHabitActions';
import { useHabitProgress } from './habits/useHabitProgress';
import { useHabitImpact } from './habits/useHabitImpact';
import { getLocalDateStr } from '../utils/dateUtils';

export function useHabits() {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const streaks = useHabitStore((s) => s.streaks);
  const badges = useHabitStore((s) => s.badges);
  const totalPoints = useHabitStore((s) => s.totalPoints);
  const isLoading = useHabitStore((s) => s.isLoading);
  const pointEntries = useHabitStore((s) => s.pointEntries);

  const { refresh } = useHabitSync();
  const { createHabit, editHabit, deleteHabit } = useHabitActions();
  const { recalcularTodasLasRachas, procesarPostCheck, confirmBadgeSeen } = useHabitImpact();
  const { toggleCheck, toggleSubtask, addSubtask } = useHabitProgress({ onPostCheck: procesarPostCheck });

  useEffect(() => {
    if (habits.length > 0) {
      recalcularTodasLasRachas();
    }
  }, [habits.length, recalcularTodasLasRachas]);

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

  return {
    habits,
    logs,
    streaks,
    badges,
    pointEntries,
    totalPoints,
    isLoading,
    sortedHabits,

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
