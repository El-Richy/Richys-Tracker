import type { Habit, Streak, EstadoRacha } from '../types';
import { getLocalDateStr, subtractDays, getDayOfWeekFromStr } from './dateUtils.ts';

/**
 * Calcula la racha actual para un hábito dado sus logs.
 * Optimizada para rendimiento usando un Set de fechas pre-filtradas.
 */
export function calcularRacha(
  habit: Habit,
  fechasCompletadas: Set<string>,
  rachaMaximaPrevia: number = 0,
): Streak {
  const hoy = getLocalDateStr();
  const hoyDow = getDayOfWeekFromStr(hoy);

  let rachaActual = 0;
  let diasGraciaConsecutivos = 0;

  const hoyCompletado = fechasCompletadas.has(hoy);
  const hoyEsDiaActivo = habit.diasActivos.includes(hoyDow);

  // 1. Verificar si hay un log con completado === true hoy
  if (hoyCompletado) {
    // 2. Si existe -> racha empieza en 1, luego cuenta hacia atrás
    rachaActual = 1;
  }
  // 3. Si no existe -> empieza en 0 y cuenta desde ayer (comportamiento por defecto)

  // Recorrer hacia atrás desde ayer (máx 365 días)
  for (let i = 1; i <= 365; i++) {
    const fechaStr = subtractDays(hoy, i);
    const dow = getDayOfWeekFromStr(fechaStr);
    const esDiaActivo = habit.diasActivos.includes(dow);

    if (!esDiaActivo) continue; // Skip días no activos

    if (fechasCompletadas.has(fechaStr)) {
      rachaActual++;
      diasGraciaConsecutivos = 0; // Reset al completar
    } else {
      diasGraciaConsecutivos++;
      if (diasGraciaConsecutivos > habit.diasGracia) {
        break; // Racha rota
      }
      // Día de gracia consumido — racha no se rompe ni incrementa
    }
  }

  // Determinar estado
  let estado: EstadoRacha;
  if (rachaActual === 0) {
    estado = 'rota';
  } else if (hoyEsDiaActivo && !hoyCompletado) {
    estado = 'en_riesgo';
  } else {
    estado = 'activa';
  }

  const rachaMaxima = Math.max(rachaActual, rachaMaximaPrevia);

  return {
    habitId: habit.id,
    rachaActual,
    rachaMaxima,
    ultimoCheck: hoyCompletado ? new Date().toISOString() : '',
    estado,
    diasGraciaRestantes: Math.max(0, habit.diasGracia - diasGraciaConsecutivos),
  };
}

// ─── Milestones ──────────────────────────────────────────

export const MILESTONES_RACHA = [3, 7, 14, 30, 100] as const;

/**
 * Detecta si se alcanzó un nuevo milestone de racha.
 * Retorna el milestone alcanzado o null.
 */
export function detectarMilestone(
  rachaAnterior: number,
  rachaActual: number,
): number | null {
  for (const milestone of MILESTONES_RACHA) {
    if (rachaAnterior < milestone && rachaActual >= milestone) {
      return milestone;
    }
  }
  return null;
}
