import { useCallback } from 'react';
import { useHabitStore, useAuthStore } from '../../store';
import { db } from '../../db';
import { supabase } from '../../lib/supabase';
import { getLocalDateStr } from '../../utils/dateUtils';
import { calcularRacha, detectarMilestone } from '../../utils/streakEngine';
import {
  crearEntradaPuntos,
  PUNTOS,
  BONUS_POR_MILESTONE,
  syncPointEntry,
  borrarPuntosDeHoy
} from '../../utils/pointsEngine';
import { evaluarBadges } from '../../utils/badges';
import { useNotifications } from '../useNotifications';

/**
 * Hook responsable de los efectos secundarios de las interacciones (Puntos, Rachas, Badges).
 */
export function useHabitImpact() {
  const user = useAuthStore((s) => s.user);
  const upsertStreakInStore = useHabitStore((s) => s.upsertStreak);
  const setStreaksInStore = useHabitStore((s) => s.setStreaks);
  const addPointEntryInStore = useHabitStore((s) => s.addPointEntry);
  const addBadgesInStore = useHabitStore((s) => s.addBadges);
  const markBadgeAsSeenInStore = useHabitStore((s) => s.markBadgeAsSeen);
  
  const { scheduleRiskReminder } = useNotifications();

  /**
   * Recalcula todas las rachas para la vista actual.
   */
  const recalcularTodasLasRachas = useCallback(async () => {
    const store = useHabitStore.getState();
    if (!store.habits.length) return;

    // Agrupar logs por hábito para eficiencia O(n)
    const logsPorHabito = new Map<string, Set<string>>();
    store.logs.forEach(l => {
      if (l.completado) {
        if (!logsPorHabito.has(l.habitId)) logsPorHabito.set(l.habitId, new Set());
        logsPorHabito.get(l.habitId)!.add(l.fecha);
      }
    });

    const nuevasRachas = store.habits.map((habit) => {
      const existing = store.streaks.find((s) => s.habitId === habit.id);
      const fechas = logsPorHabito.get(habit.id) || new Set<string>();
      const racha = calcularRacha(habit, fechas, existing?.rachaMaxima ?? 0);
      
      if (racha.estado === 'en_riesgo' && racha.rachaActual > 0) {
        scheduleRiskReminder(habit, racha.rachaActual);
      }
      return racha;
    });

    setStreaksInStore(nuevasRachas);
    await db.streaks.bulkPut(nuevasRachas).catch(e => console.error('Dexie streak bulk error:', e));
  }, [setStreaksInStore, scheduleRiskReminder]);

  /**
   * Procesa los cambios tras completar/desmarcar un hábito o subtarea.
   */
  const procesarPostCheck = useCallback(async (habitId: string, completado: boolean, fecha?: string) => {
    if (!user) return;
    const store = useHabitStore.getState();
    const habit = store.habits.find(h => h.id === habitId);
    if (!habit) return;

    const targetDate = fecha || getLocalDateStr();

    // 1. Recalcular Racha específica
    const logsActualizados = await db.habitLogs.where('habitId').equals(habitId).toArray();
    const fechasCompletas = new Set(logsActualizados.filter(l => l.completado).map(l => l.fecha));
    
    const existingStreak = store.streaks.find(s => s.habitId === habitId);
    const rachaAnterior = existingStreak?.rachaActual ?? 0;
    
    const nuevaRacha = calcularRacha(habit, fechasCompletas, existingStreak?.rachaMaxima ?? 0);
    upsertStreakInStore(nuevaRacha);
    await db.streaks.put(nuevaRacha);

    // Sync racha a Supabase
    try {
      const { error } = await supabase.from('streaks').upsert({
        habit_id: nuevaRacha.habitId,
        user_id: user.id,
        racha_actual: nuevaRacha.rachaActual,
        racha_maxima: nuevaRacha.rachaMaxima,
        ultimo_check: nuevaRacha.ultimoCheck || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'habit_id,user_id' });
      
      if (error) throw error;
    } catch (err) {
      console.error('[Sync] Error sincronizando racha:', err);
    }

    // 2. Gestionar Puntos
    if (completado) {
      // Evitar duplicados por re-renders
      const existeBase = await db.pointEntries
        .where('habitId').equals(habitId)
        .filter(e => e.fecha === targetDate && e.puntos === PUNTOS.COMPLETAR_HABITO)
        .count();

      if (existeBase === 0) {
        const entrada = crearEntradaPuntos(
          user.id,
          PUNTOS.COMPLETAR_HABITO,
          `+${PUNTOS.COMPLETAR_HABITO} por completar ${habit.nombre}`,
          targetDate,
          habitId
        );
        addPointEntryInStore(entrada);
        await db.pointEntries.add(entrada).catch(() => {});
        syncPointEntry(entrada);
      }

      // Bonus Milestones
      const milestone = detectarMilestone(rachaAnterior, nuevaRacha.rachaActual);
      if (milestone) {
        const razonBuscada = `bonus racha ${milestone} días`;
        const existeBonus = await db.pointEntries
          .where('habitId').equals(habitId)
          .filter(e => e.razon.includes(razonBuscada))
          .count();

        if (existeBonus === 0) {
          const bonusAmt = BONUS_POR_MILESTONE[milestone] || 0;
          if (bonusAmt > 0) {
            const entryVal = crearEntradaPuntos(
              user.id,
              bonusAmt,
              `+${bonusAmt} ${razonBuscada} (${habit.nombre})`,
              targetDate,
              habitId
            );
            addPointEntryInStore(entryVal);
            await db.pointEntries.add(entryVal).catch(() => {});
            syncPointEntry(entryVal);
          }
        }
      }
    } else {
      // AL DESMARCAR: Anti-Cheat
      await borrarPuntosDeHoy(habitId, targetDate);
    }

    // 3. Badges (Lazy Load stores de otros módulos)
    const { useTaskStore } = await import('../../store/taskStore');
    const { useJournalStore } = await import('../../store/journalStore');
    
    const taskStore = useTaskStore.getState();
    const journalStore = useJournalStore.getState();
    const postImpactStore = useHabitStore.getState();

    const stats = {
      rachaMaximaGlobal: Math.max(...postImpactStore.streaks.map(s => s.rachaMaxima), 0),
      totalCompletados: postImpactStore.logs.filter(l => l.completado).length,
      totalHabitos: postImpactStore.habits.length,
      totalPuntos: postImpactStore.totalPoints,
      semanasPerfectas: 0,
      totalJournalEntries: journalStore.entries.length,
      totalTareasCompletadas: taskStore.tasks.filter(t => t.completada).length,
      totalAnimoPerfecto: journalStore.entries.filter(e => e.estadoAnimo === 5).length,
      todosHabitosConRacha: postImpactStore.habits.length > 0 && postImpactStore.streaks.every(s => s.rachaActual > 0),
    };

    const nuevosBadges = evaluarBadges(stats, postImpactStore.badges.map(b => b.id));
    if (nuevosBadges.length > 0) {
      addBadgesInStore(nuevosBadges);
      await db.badges.bulkAdd(nuevosBadges).catch(() => {});
    }
  }, [user, upsertStreakInStore, addPointEntryInStore, addBadgesInStore]);

  /**
   * Marca un badge como visto.
   */
  const confirmBadgeSeen = useCallback(async (badgeId: string) => {
    markBadgeAsSeenInStore(badgeId);
    await db.badges.update(badgeId, { visto: true }).catch(() => {});
  }, [markBadgeAsSeenInStore]);

  return { 
    recalcularTodasLasRachas, 
    procesarPostCheck,
    confirmBadgeSeen
  };
}
