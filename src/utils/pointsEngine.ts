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
