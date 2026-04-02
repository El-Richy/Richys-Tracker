import { useEffect, useRef } from 'react';
import { useHabitStore, useAuthStore } from '../../store';
import { db } from '../../db';
import { supabase } from '../../lib/supabase';
import type { Habit, PointEntry, Subtarea } from '../../types';
import { calcularTotalPuntos } from '../../utils/pointsEngine';
import { getLocalDateStr } from '../../utils/dateUtils';
import { useNotifications } from '../useNotifications';

/**
 * Hook responsable de la carga inicial y sincronización de datos.
 */
export function useHabitSync() {
  const user = useAuthStore((s) => s.user);
  const setHabits = useHabitStore((s) => s.setHabits);
  const setLogs = useHabitStore((s) => s.setLogs);
  const setBadges = useHabitStore((s) => s.setBadges);
  const setPointEntries = useHabitStore((s) => s.setPointEntries);
  const setTotalPoints = useHabitStore((s) => s.setTotalPoints);
  const setLoading = useHabitStore((s) => s.setLoading);
  
  const { scheduleHabitReminder, clearHabitReminders } = useNotifications();
  
  // Para evitar múltiples cargas simultáneas
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!user || hasLoadedRef.current) return;
    
    const controller = new AbortController();
    
    const initialize = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadLocalHabits(),
          loadLocalLogs(),
          loadLocalBadges(),
          loadLocalPoints()
        ]);
        
        // Sync remoto en segundo plano
        syncRemoteData(controller.signal);
      } finally {
        setLoading(false);
        hasLoadedRef.current = true;
      }
    };

    initialize();

    return () => {
      controller.abort();
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Carga Local (Dexie) ──────────────────────────────────

  async function loadLocalHabits() {
    if (!user) return;
    const local = await db.habits.where('userId').equals(user.id).toArray();
    setHabits(local);
    local.forEach(scheduleHabitReminder);
  }

  async function loadLocalLogs() {
    const local = await db.habitLogs.toArray();
    setLogs(local);
  }

  async function loadLocalBadges() {
    const local = await db.badges.toArray();
    setBadges(local);
  }

  async function loadLocalPoints() {
    if (!user) return;
    const local = await db.pointEntries.where('userId').equals(user.id).toArray();
    setPointEntries(local);
    setTotalPoints(calcularTotalPuntos(local));
  }

  // ─── Sync Remoto (Supabase) ───────────────────────────────

  async function syncRemoteData(signal: AbortSignal) {
    if (!user) return;

    try {
      // 1. Sync Habitos
      const { data: remoteHabits, error: hError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .abortSignal(signal);

      if (!hError && remoteHabits) {
        const mapped = remoteHabits.map(mapSupabaseHabit);
        const remoteIds = new Set(mapped.map(h => h.id));
        
        // Limpiar locales huérfanos
        const localHabits = await db.habits.where('userId').equals(user.id).toArray();
        const toDelete = localHabits.filter(lh => !remoteIds.has(lh.id)).map(lh => lh.id);
        
        if (toDelete.length > 0) {
          await db.habits.bulkDelete(toDelete);
          toDelete.forEach(id => clearHabitReminders(id));
        }

        await db.habits.bulkPut(mapped);
        setHabits(mapped);
        mapped.forEach(scheduleHabitReminder);
      }

      // 2. Sync Puntos
      const { data: remotePoints, error: pError } = await supabase
        .from('point_entries')
        .select('*')
        .eq('user_id', user.id)
        .abortSignal(signal);

      if (!pError && remotePoints) {
        const mapped = remotePoints.map(mapSupabasePointEntry);
        await db.pointEntries.bulkPut(mapped);
        setPointEntries(mapped);
        setTotalPoints(calcularTotalPuntos(mapped));
      }

    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Sync error:', err);
      }
    }
  }

  return { refresh: syncRemoteData };
}

// ─── Mappers ──────────────────────────────────────────────

interface SupabaseHabit {
  id: string;
  nombre: string;
  color: string;
  icono: string;
  recordatorio_hora: string | null;
  dias_activos: number[];
  dias_gracia: number;
  creado_en: string;
  user_id: string;
  subtareas: Subtarea[];
  prioridad: 'alta' | 'media' | 'baja';
}

function mapSupabaseHabit(row: SupabaseHabit): Habit {
  return {
    id: row.id,
    nombre: row.nombre,
    color: row.color,
    icono: row.icono,
    recordatorioHora: row.recordatorio_hora,
    diasActivos: row.dias_activos || [],
    diasGracia: row.dias_gracia ?? 0,
    creadoEn: row.creado_en,
    userId: row.user_id,
    subtareas: row.subtareas ?? [],
    prioridad: row.prioridad ?? 'media',
  };
}

interface SupabasePointEntry {
  id: string;
  user_id: string;
  habit_id: string | null;
  creado_en: string;
  puntos: number;
  razon: string;
}

function mapSupabasePointEntry(row: SupabasePointEntry): PointEntry {
  return {
    id: row.id,
    userId: row.user_id,
    habitId: row.habit_id ?? undefined,
    fecha: row.creado_en ? row.creado_en.slice(0, 10) : getLocalDateStr(),
    puntos: row.puntos,
    razon: row.razon,
  };
}
