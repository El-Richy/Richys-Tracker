import { useCallback } from 'react';
import { useHabitStore, useAuthStore, useTaskStore, useJournalStore } from '../../store';
import { db } from '../../db';
import { getLocalDateStr } from '../../utils/dateUtils';
import { calcularRacha, detectarMilestone } from '../../utils/streakEngine';
import {
  crearEntradaPuntos,
  BONUS_POR_MILESTONE,
  borrarPuntosDeHoy,
  calcularPuntosHabito,
} from '../../utils/pointsEngine';
import { evaluarBadges } from '../../utils/badges';
import { scheduleRiskReminder } from '../../lib/notifications';

// Must cover calcularRacha's 365-day walk. A shorter window rewrites a
// longer streak as broken on the next check.
const MAX_LOG_DAYS = 365;

export function useHabitImpact() {
  const user = useAuthStore((s) => s.user);
  const upsertStreakInStore = useHabitStore((s) => s.upsertStreak);
  const setStreaksInStore = useHabitStore((s) => s.setStreaks);
  const addPointEntryInStore = useHabitStore((s) => s.addPointEntry);
  const addBadgesInStore = useHabitStore((s) => s.addBadges);
  const markBadgeAsSeenInStore = useHabitStore((s) => s.markBadgeAsSeen);

  const recalcularTodasLasRachas = useCallback(async () => {
    const store = useHabitStore.getState();
    if (!store.habits.length) return;

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
        scheduleRiskReminder(habit.id, habit.nombre);
      }
      return racha;
    });

    setStreaksInStore(nuevasRachas);
    await db.streaks.bulkPut(nuevasRachas).catch(e => console.error('Dexie streak bulk error:', e));
  }, [setStreaksInStore]);

  const getRecentLogDates = useCallback(async (habitId: string) => {
    const hoy = new Date();
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() - MAX_LOG_DAYS);
    const limiteStr = getLocalDateStr(limite);

    const logs = await db.habitLogs
      .where('habitId')
      .equals(habitId)
      .filter(l => l.fecha >= limiteStr)
      .toArray();

    return new Set(logs.filter(l => l.completado).map(l => l.fecha));
  }, []);

  const procesarPostCheck = useCallback(async (habitId: string, completado: boolean, fecha?: string) => {
    if (!user) return;
    const store = useHabitStore.getState();
    const habit = store.habits.find(h => h.id === habitId);
    if (!habit) return;

    const targetDate = fecha || getLocalDateStr();

    const fechasCompletas = await getRecentLogDates(habitId);
    const existingStreak = store.streaks.find(s => s.habitId === habitId);
    const rachaAnterior = existingStreak?.rachaActual ?? 0;

    const nuevaRacha = calcularRacha(habit, fechasCompletas, existingStreak?.rachaMaxima ?? 0);
    upsertStreakInStore(nuevaRacha);
    await db.streaks.put(nuevaRacha);

    if (completado) {
      const puntosBase = calcularPuntosHabito(nuevaRacha.rachaActual);

      const existeBase = await db.pointEntries
        .where('habitId').equals(habitId)
        .filter(e => e.fecha === targetDate && e.puntos === puntosBase)
        .count();

      if (existeBase === 0) {
        const entrada = crearEntradaPuntos(
          user.id,
          puntosBase,
          `+${puntosBase} por completar ${habit.nombre}`,
          targetDate,
          habitId,
          'habit'
        );
        addPointEntryInStore(entrada);
        await db.pointEntries.add(entrada).catch(() => {});
      }

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
              habitId,
              'habit'
            );
            addPointEntryInStore(entryVal);
            await db.pointEntries.add(entryVal).catch(() => {});
          }
        }
      }
    } else {
      await borrarPuntosDeHoy(habitId, targetDate);
    }

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
  }, [user, upsertStreakInStore, addPointEntryInStore, addBadgesInStore, getRecentLogDates]);

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
