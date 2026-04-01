import type { Habit, HabitLog, Streak, EstadoRacha } from '../types';
import { getLocalDateStr, subtractDays, getDayOfWeekFromStr } from './dateUtils';

/**
 * Calcula la racha actual para un hábito dado sus logs.
 *
 * Algoritmo:
 * 1. Si hoy es día activo y fue completado → cuenta hacia la racha.
 * 2. Recorre hacia atrás desde ayer buscando días activos.
 * 3. Si un día activo fue completado → suma a la racha.
 * 4. Si un día activo NO fue completado → consume día de gracia.
 * 5. Si se agotan los días de gracia → racha rota, break.
 * 6. Días no activos se omiten (no rompen ni suman).
 */
export function calcularRacha(
  habit: Habit,
  logs: HabitLog[],
  rachaMaximaPrevia: number = 0,
): Streak {
  const hoy = getLocalDateStr();
  const hoyDow = getDayOfWeekFromStr(hoy);

  // Set de fechas completadas para este hábito
  const fechasCompletadas = new Set(
    logs
      .filter((l) => l.habitId === habit.id && l.completado)
      .map((l) => l.fecha),
  );

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
