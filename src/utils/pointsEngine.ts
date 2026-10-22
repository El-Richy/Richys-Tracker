import { db } from '../db';
import { useHabitStore } from '../store';
import type { PointEntry } from '../types';
import { generateId } from './idUtils';

export const PUNTOS = {
  COMPLETAR_HABITO: 1,
  COMPLETAR_TAREA: 1,
  BONUS_RACHA_3: 3,
  BONUS_RACHA_7: 5,
  BONUS_RACHA_14: 10,
  BONUS_RACHA_30: 20,
  BONUS_RACHA_100: 50,
  PENALIZACION_ROMPER: -5,
} as const;

export const MULTIPLICADOR_POR_RACHA: Record<number, number> = {
  7: 2,
  30: 3,
};

export const BONUS_POR_MILESTONE: Record<number, number> = {
  3: PUNTOS.BONUS_RACHA_3,
  7: PUNTOS.BONUS_RACHA_7,
  14: PUNTOS.BONUS_RACHA_14,
  30: PUNTOS.BONUS_RACHA_30,
  100: PUNTOS.BONUS_RACHA_100,
};

export function calcularPuntosHabito(rachaActual: number): number {
  if (rachaActual >= 30) return PUNTOS.COMPLETAR_HABITO * 3;
  if (rachaActual >= 7) return PUNTOS.COMPLETAR_HABITO * 2;
  return PUNTOS.COMPLETAR_HABITO;
}

export function etiquetaMultiplicador(rachaActual: number): string | null {
  if (rachaActual >= 30) return '×3';
  if (rachaActual >= 7) return '×2';
  return null;
}

export function crearEntradaPuntos(
  userId: string,
  puntos: number,
  razon: string,
  fecha: string,
  habitId?: string,
  origenTipo?: 'habit' | 'task',
): PointEntry {
  return {
    id: generateId(),
    userId,
    habitId,
    fecha,
    puntos,
    razon,
    origenTipo,
  };
}

export function calcularTotalPuntos(entries: PointEntry[]): number {
  return Math.max(0, entries.reduce((sum, e) => sum + e.puntos, 0));
}

export async function borrarPuntosDeHoy(habitId: string, fecha: string) {
  try {
    const normalizedFecha = fecha.slice(0, 10);

    const entradasHoy = await db.pointEntries
      .where('[habitId+fecha]')
      .equals([habitId, normalizedFecha])
      .filter(e => e.puntos > 0)
      .toArray();

    if (entradasHoy.length === 0) return;

    const ids = entradasHoy.map(e => e.id);

    await db.pointEntries.bulkDelete(ids);

    const store = useHabitStore.getState();
    const currentEntries = store.pointEntries;
    const remainingEntries = currentEntries.filter(e => !ids.includes(e.id));

    store.setPointEntries(remainingEntries);
    store.setTotalPoints(calcularTotalPuntos(remainingEntries));
  } catch (err) {
    console.error('Anti-cheat system error critical:', err);
  }
}
