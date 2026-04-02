import { supabase } from '../lib/supabase';
import { db } from '../db';
import { useHabitStore } from '../store';
import type { PointEntry } from '../types';
import { generateId } from './idUtils';

// ─── Constantes de puntos ────────────────────────────────

export const PUNTOS = {
  COMPLETAR_HABITO: 10,
  COMPLETAR_SUBTAREA: 3,
  BONUS_RACHA_3: 25,
  BONUS_RACHA_7: 50,
  BONUS_RACHA_14: 100,
  BONUS_RACHA_30: 250,
  BONUS_RACHA_100: 1000,
  PENALIZACION_ROMPER: -5,
} as const;

/** Mapea milestone de racha → puntos bonus */
export const BONUS_POR_MILESTONE: Record<number, number> = {
  3: PUNTOS.BONUS_RACHA_3,
  7: PUNTOS.BONUS_RACHA_7,
  14: PUNTOS.BONUS_RACHA_14,
  30: PUNTOS.BONUS_RACHA_30,
  100: PUNTOS.BONUS_RACHA_100,
};

// ─── Factory ─────────────────────────────────────────────

/**
 * Crea una entrada de puntos con ID generado.
 */
export function crearEntradaPuntos(
  userId: string,
  puntos: number,
  razon: string,
  fecha: string,
  habitId?: string,
): PointEntry {
  return {
    id: generateId(),
    userId,
    habitId,
    fecha,
    puntos,
    razon,
  };
}

/**
 * Calcula el total de puntos desde un array de entradas.
 * Nunca retorna menos de 0.
 */
export function calcularTotalPuntos(entries: PointEntry[]): number {
  return Math.max(0, entries.reduce((sum, e) => sum + e.puntos, 0));
}

// ─── Sync & Anti-Cheat ───────────────────────────────────

/**
 * Sincroniza una entrada de puntos con Supabase.
 */
export async function syncPointEntry(entry: PointEntry) {
  try {
    const { error } = await supabase.from('point_entries').insert({
      id: entry.id,
      user_id: entry.userId,
      habit_id: entry.habitId,
      puntos: entry.puntos,
      razon: entry.razon,
      creado_en: entry.fecha,
    });
    
    if (error) {
      console.error(`[Sync] Error insertando puntos (${entry.id}):`, error.message);
    }
  } catch (err) {
    console.error(`[Sync] Error de red al sincronizar puntos:`, err);
  }
}

/**
 * Sistema Anti-Cheat: Borra puntos otorgados hoy para un hábito específico.
 * Se usa al desmarcar un hábito o fallar una racha retrospectivamente.
 * Optimizado con índice compuesto [habitId+fecha].
 */
export async function borrarPuntosDeHoy(habitId: string, fecha: string) {
  try {
    // Normalizar fecha (YYYY-MM-DD)
    const normalizedFecha = fecha.slice(0, 10);
    
    // 1. Buscar en Dexie usando índice compuesto (O(log n) vs O(n))
    const entradasHoy = await db.pointEntries
      .where('[habitId+fecha]')
      .equals([habitId, normalizedFecha])
      .filter(e => e.puntos > 0)
      .toArray();

    if (entradasHoy.length === 0) return;

    const ids = entradasHoy.map(e => e.id);

    // 2. Dexie Delete
    await db.pointEntries.bulkDelete(ids);

    // 3. Store Update
    const store = useHabitStore.getState();
    const currentEntries = store.pointEntries;
    const remainingEntries = currentEntries.filter(e => !ids.includes(e.id));
    
    store.setPointEntries(remainingEntries);
    store.setTotalPoints(calcularTotalPuntos(remainingEntries));

    // 4. Supabase Sync con Promise.allSettled para robustez
    const syncDeletes = ids.map(id => 
      supabase.from('point_entries').delete().eq('id', id)
    );
    
    const results = await Promise.allSettled(syncDeletes);
    results.forEach((res, idx) => {
      if (res.status === 'rejected' || (res.value as any).error) {
        console.error(`[Anti-Cheat] Error al sincronizar borrado de punto ${ids[idx]}`);
      }
    });

  } catch (err) {
    console.error('Anti-cheat system error critical:', err);
  }
}
