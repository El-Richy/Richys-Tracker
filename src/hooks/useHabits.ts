import { useCallback, useEffect, useMemo } from 'react';
import { useHabitStore } from '../store';
import { useAuthStore } from '../store';
import { db } from '../db';
import { supabase } from '../lib/supabase';
import type { Habit, HabitLog, BadgeStats, PointEntry } from '../types';
import { getLocalDateStr } from '../utils/dateUtils';
import { calcularRacha, detectarMilestone } from '../utils/streakEngine';
import {
  crearEntradaPuntos,
  calcularTotalPuntos,
  PUNTOS,
  BONUS_POR_MILESTONE,
} from '../utils/pointsEngine';
import { evaluarBadges } from '../utils/badges';
import { useNotifications } from './useNotifications';

import { generateId } from '../utils/idUtils';

/**
 * Hook coordinador para CRUD de hábitos, checks diarios,
 * rachas, puntos y badges.
 * Patrón offline-first: Dexie primero → Zustand → Supabase en background.
 */
export function useHabits() {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);
  const streaks = useHabitStore((s) => s.streaks);
  const badges = useHabitStore((s) => s.badges);
  const pointEntries = useHabitStore((s) => s.pointEntries);
  const totalPoints = useHabitStore((s) => s.totalPoints);
  const isLoading = useHabitStore((s) => s.isLoading);

  const setHabits = useHabitStore((s) => s.setHabits);
  const addHabitToStore = useHabitStore((s) => s.addHabit);
  const updateHabitInStore = useHabitStore((s) => s.updateHabit);
  const removeHabitFromStore = useHabitStore((s) => s.removeHabit);
  const setLogs = useHabitStore((s) => s.setLogs);
  const upsertLog = useHabitStore((s) => s.upsertLog);
  const setStreaks = useHabitStore((s) => s.setStreaks);
  const upsertStreak = useHabitStore((s) => s.upsertStreak);
  const setBadges = useHabitStore((s) => s.setBadges);
  const addBadges = useHabitStore((s) => s.addBadges);
  const setPointEntries = useHabitStore((s) => s.setPointEntries);
  const addPointEntry = useHabitStore((s) => s.addPointEntry);
  const setTotalPoints = useHabitStore((s) => s.setTotalPoints);
  const setLoading = useHabitStore((s) => s.setLoading);
  const markBadgeAsSeenInStore = useHabitStore((s) => s.markBadgeAsSeen);

  const user = useAuthStore((s) => s.user);
  const {
    scheduleHabitReminder,
    scheduleRiskReminder,
    clearHabitReminders,
  } = useNotifications();

  // ─── Cargar datos al montar ────────────────────────────────

  useEffect(() => {
    if (!user) return;
    loadHabits();
    loadRecentLogs();
    loadBadges();
    loadPointEntries();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calcular rachas una vez que tenemos habits y logs
  useEffect(() => {
    if (habits.length > 0 && logs.length >= 0) {
      recalcularTodasLasRachas();
    }
  }, [habits.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Loaders ───────────────────────────────────────────────

  async function loadHabits() {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Carga inicial rápida desde Dexie
      const localHabits = await db.habits.where('userId').equals(user.id).toArray();
      setHabits(localHabits);
      localHabits.forEach(scheduleHabitReminder);

      // 2. Sync desde Supabase (Maestro definitivo)
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        const mapped = data.map(mapSupabaseHabit);
        const remoteIds = new Set(mapped.map(h => h.id));
        
        // Limpiar en Dexie lo que ya no está en Supabase
        const toDelete = localHabits.filter(lh => !remoteIds.has(lh.id)).map(lh => lh.id);
        if (toDelete.length > 0) {
          await db.habits.bulkDelete(toDelete);
          toDelete.forEach(id => clearHabitReminders(id));
        }

        // Actualizar/Insertar los de Supabase
        await db.habits.bulkPut(mapped);
        setHabits(mapped);
        
        mapped.forEach((h) => {
          clearHabitReminders(h.id);
          scheduleHabitReminder(h);
        });
      }
    } catch (err) {
      console.error('Error loading habits:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadRecentLogs() {
    if (!user) return;
    try {
      // Cargar todos los logs de Dexie (necesarios para rachas y gráficos)
      const localLogs = await db.habitLogs.toArray();
      setLogs(localLogs);
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  }

  async function loadBadges() {
    try {
      const localBadges = await db.badges.toArray();
      setBadges(localBadges);
    } catch (err) {
      console.error('Error loading badges:', err);
    }
  }

  async function loadPointEntries() {
    if (!user) return;
    try {
      const localEntries = await db.pointEntries
        .where('userId')
        .equals(user.id)
        .toArray();
      setPointEntries(localEntries);
      setTotalPoints(calcularTotalPuntos(localEntries));

      // Sync desde Supabase
      const { data, error } = await supabase
        .from('point_entries')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        const mapped = data.map(mapSupabasePointEntry);
        await db.pointEntries.bulkPut(mapped);
        setPointEntries(mapped);
        setTotalPoints(calcularTotalPuntos(mapped));
      } else if (error) {
        console.error('Supabase load points error:', error.message);
      }
    } catch (err) {
      console.error('Error loading points:', err);
    }
  }

  // ─── Rachas ────────────────────────────────────────────────

  function recalcularTodasLasRachas() {
    const currentStore = useHabitStore.getState();
    const nuevasRachas = currentStore.habits.map((habit) => {
      const existingStreak = currentStore.streaks.find((s) => s.habitId === habit.id);
      const racha = calcularRacha(habit, currentStore.logs, existingStreak?.rachaMaxima ?? 0);
      
      if (racha.estado === 'en_riesgo' && racha.rachaActual > 0) {
        scheduleRiskReminder(habit, racha.rachaActual);
      }
      
      return racha;
    });
    setStreaks(nuevasRachas);

    // Persistir en Dexie (background)
    Promise.all(nuevasRachas.map((s) => db.streaks.put(s))).catch((err) =>
      console.error('Error saving streaks to Dexie:', err),
    );
  }

  async function procesarPostCheck(habitId: string, completado: boolean) {
    if (!user) return;
    const currentStore = useHabitStore.getState();
    const today = getLocalDateStr();
    
    // Obtenemos del store actual para evitar records obsoletos (closures)
    const storeHabit = currentStore.habits.find((h) => h.id === habitId);
    if (!storeHabit) return;

    // 1. Recalcular racha con logs actualizados desde la BD local (frescos)
    const logsActualizados = await db.habitLogs
      .where('habitId')
      .equals(habitId)
      .toArray();

    const existingStreak = currentStore.streaks.find((s) => s.habitId === habitId);
    const rachaAnterior = existingStreak?.rachaActual ?? 0;
    const nuevaRacha = calcularRacha(
      storeHabit,
      logsActualizados,
      existingStreak?.rachaMaxima ?? 0,
    );
    
    // DEBUG: Log de la racha
    console.log('--- DEBUG RACHA ---');
    console.log({ 
      habitId: nuevaRacha.habitId, 
      rachaActual: nuevaRacha.rachaActual, 
      rachaMaxima: nuevaRacha.rachaMaxima, 
      estado: nuevaRacha.estado 
    });

    upsertStreak(nuevaRacha);

    // Persistir racha en Dexie
    await db.streaks.put(nuevaRacha);

    // Sync racha a Supabase
    supabase
      .from('streaks')
      .upsert(
        {
          habit_id: nuevaRacha.habitId,
          user_id: user.id,
          racha_actual: nuevaRacha.rachaActual,
          racha_maxima: nuevaRacha.rachaMaxima,
          ultimo_check: nuevaRacha.ultimoCheck || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'habit_id,user_id' }
      )
      .then(({ error }) => {
        if (error) console.error('Sync streak error:', error.message);
      });

    // 2. Otorgar o quitar puntos
    if (completado) {
      // Verificar en Dexie si ya existe PointEntry base (10 pts) hoy
      const existeBase = await db.pointEntries
        .where('habitId')
        .equals(habitId)
        .filter((e) => e.fecha === today && e.puntos === PUNTOS.COMPLETAR_HABITO)
        .count();

      if (existeBase === 0) {
        // Puntos por completar hábito
        const entrada = crearEntradaPuntos(
          user.id,
          PUNTOS.COMPLETAR_HABITO,
          `+${PUNTOS.COMPLETAR_HABITO} por completar ${storeHabit.nombre}`,
          today,
          habitId,
        );
        addPointEntry(entrada);
        try {
          await db.pointEntries.add(entrada);
        } catch (dbErr) {
          console.error('Dexie point add error:', dbErr);
        }
        syncPointEntry(entrada);
      }

      // Bonus por milestone de racha
      const milestone = detectarMilestone(rachaAnterior, nuevaRacha.rachaActual);
      if (milestone) {
        const razonBuscada = `bonus racha ${milestone} días`;
        
        // Verificar en Dexie si ya existe bono por este milestone
        const existeBonus = await db.pointEntries
          .where('habitId')
          .equals(habitId)
          .filter((e) => e.razon.includes(razonBuscada))
          .count();

        if (existeBonus === 0) {
          const bonus = BONUS_POR_MILESTONE[milestone];
          if (bonus) {
            const entradaBonus = crearEntradaPuntos(
              user.id,
              bonus,
              `+${bonus} ${razonBuscada} (${storeHabit.nombre})`,
              today,
              habitId,
            );
            addPointEntry(entradaBonus);
            try {
              await db.pointEntries.add(entradaBonus);
            } catch (dbErr) {
              console.error('Dexie point bonus add error:', dbErr);
            }
            syncPointEntry(entradaBonus);
          }
        }
      }
    } else {
      // AL DESMARCAR: Sistema Anti-Cheat
      // Buscar la entrada de puntos de hoy para este hábito y borrarla
      const entradasHoy = await db.pointEntries
        .where('habitId')
        .equals(habitId)
        .filter(e => e.fecha === today && e.puntos > 0)
        .toArray();

      if (entradasHoy.length > 0) {
        const ids = entradasHoy.map(e => e.id);
        
        // 1. Dexie
        await db.pointEntries.bulkDelete(ids);
        
        // 2. Store (Remover y recalcular)
        const currentEntries = useHabitStore.getState().pointEntries;
        const remainingEntries = currentEntries.filter(e => !ids.includes(e.id));
        setPointEntries(remainingEntries);
        setTotalPoints(calcularTotalPuntos(remainingEntries));

        // 3. Supabase Sync (Borrar entradas)
        await Promise.all(ids.map(id => 
          supabase.from('point_entries').delete().eq('id', id).then(({ error }) => {
            if (error) console.error('Sync delete point entry error:', error.message);
          })
        ));
      }
    }

    // 3. Evaluar badges usando el fresh store
    const postPointsStore = useHabitStore.getState();
    const { tasks } = (await import('../store/taskStore')).useTaskStore.getState();
    const { entries: journalEntries } = (await import('../store/journalStore')).useJournalStore.getState();

    const stats: BadgeStats = {
      rachaMaximaGlobal: Math.max(
        ...postPointsStore.streaks.map((s) => s.rachaMaxima),
        0,
      ),
      totalCompletados: postPointsStore.logs.filter((l) => l.completado).length,
      totalHabitos: postPointsStore.habits.length,
      totalPuntos: postPointsStore.totalPoints,
      semanasPerfectas: 0,
      totalJournalEntries: journalEntries.length,
      totalTareasCompletadas: tasks.filter(t => t.completada).length,
      totalAnimoPerfecto: journalEntries.filter(e => e.estadoAnimo === 5).length,
      todosHabitosConRacha: postPointsStore.habits.length > 0 && postPointsStore.streaks.every(s => s.rachaActual > 0),
    };


    const nuevos = evaluarBadges(
      stats,
      postPointsStore.badges.map((b) => b.id),
    );

    if (nuevos.length > 0) {
      addBadges(nuevos);
      await db.badges.bulkAdd(nuevos);
    }
  }

  async function syncPointEntry(entry: PointEntry) {
    try {
      const { error } = await supabase
        .from('point_entries')
        .insert({
          id: entry.id,
          user_id: entry.userId,
          habit_id: entry.habitId || null,
          puntos: entry.puntos,
          razon: entry.razon,
          creado_en: entry.fecha, // Usamos la fecha del registro
        });
      if (error) {
        console.error('Sync point entry error:', error.message);
      }
    } catch (err: unknown) {
      console.error('Sync point entry EXCEPTION:', err);
    }
  }

  // ─── CRUD de hábitos ──────────────────────────────────────

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
      subtareas: data.subtareas,
      prioridad: data.prioridad || 'media',
    };

    // Dexie primero
    await db.habits.add(habit);
    addHabitToStore(habit);
    scheduleHabitReminder(habit);

    // Supabase en background
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
    }).then(({ error }) => {
      if (error) console.error('Sync create habit error:', error.message);
    });
  }, [user, addHabitToStore, scheduleHabitReminder]);

  const editHabit = useCallback(async (
    id: string,
    updates: Pick<Habit, 'nombre' | 'color' | 'icono' | 'subtareas' | 'diasActivos' | 'diasGracia' | 'recordatorioHora' | 'prioridad'>
  ) => {
    // Dexie primero
    await db.habits.update(id, updates);
    updateHabitInStore(id, updates);

    const store = useHabitStore.getState();
    const updatedHabit = store.habits.find((h) => h.id === id);
    if (updatedHabit) {
      clearHabitReminders(id);
      scheduleHabitReminder(updatedHabit);
    }

    // Supabase en background
    supabase.from('habits').update({
      nombre: updates.nombre,
      color: updates.color,
      icono: updates.icono,
      recordatorio_hora: updates.recordatorioHora,
      dias_activos: updates.diasActivos,
      dias_gracia: updates.diasGracia,
      subtareas: updates.subtareas,
      prioridad: updates.prioridad,
    }).eq('id', id).then(({ error }) => {
      if (error) console.error('Sync update habit error:', error.message);
    });
  }, [updateHabitInStore, clearHabitReminders, scheduleHabitReminder]);

  const deleteHabit = useCallback(async (id: string) => {
    try {
      // 1. Borrado inicial en Supabase (opcionalmente esperar o manejar error)
      const { error } = await supabase.from('habits').delete().eq('id', id);
      if (error) {
        console.error('Error al borrar en Supabase:', error.message);
        // Para UX borramos local de todos modos.
      }

      // 2. Dexie Delete (Limpieza profunda)
      await db.habits.delete(id);
      clearHabitReminders(id);
      await db.habitLogs.where('habitId').equals(id).delete();
      await db.streaks.delete(id);
      try {
        await db.pointEntries.where('habitId').equals(id).delete();
      } catch (err) {
        console.warn('Omitiendo clean up de puntos local:', err);
      }
      
      // 3. Zustand Store Update (Solo al final para evitar re-render con datos antiguos de la nube)
      removeHabitFromStore(id);
      
    } catch (err) {
      console.error('Local delete habit error:', err);
    }
  }, [removeHabitFromStore, clearHabitReminders]);

  // ─── Check diario ─────────────────────────────────────────

  const toggleCheck = useCallback(async (habitId: string) => {
    const today = getLocalDateStr();
    const existing = logs.find(
      (l) => l.habitId === habitId && l.fecha === today
    );

    const log: HabitLog = existing
      ? { ...existing, completado: !existing.completado }
      : {
          id: generateId(),
          habitId,
          fecha: today,
          completado: true,
          subtareasCompletadas: [],
        };

    // Dexie primero
    await db.habitLogs.put(log);
    upsertLog(log);

    // AL DESMARCAR: Sistema Anti-Cheat AGRESIVO
    if (!log.completado) {
      const todayStr = today;
      const entradasHoy = await db.pointEntries
        .where('habitId')
        .equals(habitId)
        .filter(e => e.fecha === todayStr && e.puntos > 0)
        .toArray();

      if (entradasHoy.length > 0) {
        const ids = entradasHoy.map(e => e.id);
        await db.pointEntries.bulkDelete(ids);
        
        const currentEntries = useHabitStore.getState().pointEntries;
        const remainingEntries = currentEntries.filter(e => !ids.includes(e.id));
        useHabitStore.getState().setPointEntries(remainingEntries);
        const newTotal = calcularTotalPuntos(remainingEntries);
        useHabitStore.getState().setTotalPoints(newTotal);

        for (const id of ids) {
          supabase.from('point_entries').delete().eq('id', id).then(({ error }) => {
            if (error) console.error('Sync delete point entry error:', error.message);
          });
        }
      }
    }

    if (log.completado) {
      clearHabitReminders(habitId);
      const storeHabit = useHabitStore.getState().habits.find(h => h.id === habitId);
      if (storeHabit) {
        scheduleHabitReminder(storeHabit);
      }
    }

    // Supabase en background
    supabase.from('habit_logs').upsert({
      id: log.id,
      habit_id: log.habitId,
      fecha: log.fecha,
      completado: log.completado,
      subtareas_completadas: log.subtareasCompletadas,
      razon_fallo: log.razonFallo ?? null,
    }, { onConflict: 'habit_id,fecha' }).then(({ error }) => {
      if (error) console.error('Sync toggle check error:', error.message);
    });

    // Efectos secundarios: racha, puntos, badges
    procesarPostCheck(habitId, log.completado);
  }, [logs, upsertLog, clearHabitReminders, scheduleHabitReminder]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSubtask = useCallback(async (habitId: string, subtaskId: string) => {
    const today = getLocalDateStr();
    const existing = logs.find(
      (l) => l.habitId === habitId && l.fecha === today
    );

    const currentCompleted = existing?.subtareasCompletadas ?? [];
    const isCompleted = currentCompleted.includes(subtaskId);
    const newCompleted = isCompleted
      ? currentCompleted.filter((id) => id !== subtaskId)
      : [...currentCompleted, subtaskId];

    const log: HabitLog = existing
      ? { ...existing, subtareasCompletadas: newCompleted }
      : {
          id: generateId(),
          habitId,
          fecha: today,
          completado: false,
          subtareasCompletadas: newCompleted,
        };

    // Auto-check logic
    const habit = habits.find((h) => h.id === habitId);
    const totalSubtasks = habit?.subtareas.length || 0;
    const wasCompletedBefore = existing?.completado ?? false;
    if (totalSubtasks > 0) {
      log.completado = newCompleted.length === totalSubtasks;
    }

    await db.habitLogs.put(log);
    upsertLog(log);

    // Supabase en background
    supabase.from('habit_logs').upsert({
      id: log.id,
      habit_id: log.habitId,
      fecha: log.fecha,
      completado: log.completado,
      subtareas_completadas: log.subtareasCompletadas,
      razon_fallo: log.razonFallo ?? null,
    }, { onConflict: 'habit_id,fecha' }).then(({ error }) => {
      if (error) console.error('Sync toggle subtask error:', error.message);
    });

    // Efectos si el estado de completado cambió
    if (log.completado && !wasCompletedBefore) {
      procesarPostCheck(habitId, true);
    } else if (!log.completado && wasCompletedBefore) {
      procesarPostCheck(habitId, false);
    }
  }, [logs, habits, upsertLog]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Inline Adding ────────────────────────────────────────

  const addSubtask = useCallback(async (habitId: string, subtaskName: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const newSubtask = {
      id: generateId(),
      nombre: subtaskName,
    };
    const updatedSubtasks = [...habit.subtareas, newSubtask];

    // Dexie
    await db.habits.update(habitId, { subtareas: updatedSubtasks });
    updateHabitInStore(habitId, { subtareas: updatedSubtasks });

    // Supabase en background
    supabase.from('habits')
      .update({ subtareas: updatedSubtasks })
      .eq('id', habitId)
      .then(({ error }) => {
        if (error) console.error('Sync add subtask error:', error.message);
      });
  }, [habits, updateHabitInStore]);

  // ─── Helpers ──────────────────────────────────────────────

  const confirmBadgeSeen = useCallback(async (id: string) => {
    markBadgeAsSeenInStore(id);
    await db.badges.update(id, { visto: true });
  }, [markBadgeAsSeenInStore]);

  const getLogForHabit = useCallback((habitId: string): HabitLog | undefined => {
    const today = getLocalDateStr();
    return logs.find((l) => l.habitId === habitId && l.fecha === today);
  }, [logs]);

  const getStreakForHabit = useCallback((habitId: string) => {
    return streaks.find((s) => s.habitId === habitId) ?? null;
  }, [streaks]);

  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => 
      new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
    );
  }, [habits]);

  return {
    habits: sortedHabits,
    logs,
    streaks,
    badges,
    totalPoints,
    pointEntries,
    isLoading,
    createHabit,
    editHabit,
    deleteHabit,
    toggleCheck,
    toggleSubtask,
    addSubtask,
    getLogForHabit,
    getStreakForHabit,
    confirmBadgeSeen,
  };
}

// ─── Mappers ──────────────────────────────────────────────

function mapSupabaseHabit(row: Record<string, unknown>): Habit {
  return {
    id: row.id as string,
    nombre: row.nombre as string,
    color: row.color as string,
    icono: row.icono as string,
    recordatorioHora: (row.recordatorio_hora as string) ?? null,
    diasActivos: row.dias_activos as number[],
    diasGracia: row.dias_gracia as number,
    creadoEn: row.creado_en as string,
    userId: row.user_id as string,
    subtareas: (row.subtareas as Habit['subtareas']) ?? [],
    prioridad: (row.prioridad as Habit['prioridad']) ?? 'media',
  };
}

function mapSupabasePointEntry(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    habitId: (row.habit_id as string) ?? undefined,
    fecha: row.creado_en as string,
    puntos: row.puntos as number,
    razon: row.razon as string,
  };
}
