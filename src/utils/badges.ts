import type { Badge, BadgeStats } from '../types';

// ─── Definición de badge (con función evaluadora) ────────

export interface BadgeDef {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  /** Descripción legible de la condición */
  condicion: string;
  /** Función que evalúa si el badge se desbloqueó */
  evaluar: (stats: BadgeStats) => boolean;
}

// ─── Catálogo de badges ──────────────────────────────────

export const BADGE_DEFINITIONS: BadgeDef[] = [
  // ── Rachas ──
  { id: 'streak_3', nombre: 'Primer Impulso', descripcion: 'Alcanza 3 días de racha', icono: '🔥', condicion: 'Racha ≥ 3', evaluar: (s) => s.rachaMaximaGlobal >= 3 },
  { id: 'streak_7', nombre: 'Semana de Fuego', descripcion: '7 días seguidos', icono: '🔥', condicion: 'Racha ≥ 7', evaluar: (s) => s.rachaMaximaGlobal >= 7 },
  { id: 'streak_14', nombre: 'Quincena Imparable', descripcion: '14 días seguidos', icono: '💪', condicion: 'Racha ≥ 14', evaluar: (s) => s.rachaMaximaGlobal >= 14 },
  { id: 'streak_30', nombre: 'Hábito de Hierro', descripcion: '30 días seguidos', icono: '⚔️', condicion: 'Racha ≥ 30', evaluar: (s) => s.rachaMaximaGlobal >= 30 },
  { id: 'streak_100', nombre: 'Centenario', descripcion: '100 días seguidos', icono: '👑', condicion: 'Racha ≥ 100', evaluar: (s) => s.rachaMaximaGlobal >= 100 },

  // ── Completitud ──
  { id: 'first_check', nombre: 'Primer Paso', descripcion: 'Completa tu primer hábito', icono: '⭐', condicion: '1 completado', evaluar: (s) => s.totalCompletados >= 1 },
  { id: 'checks_50', nombre: 'Medio Centenar', descripcion: '50 completados totales', icono: '🏅', condicion: '50 completados', evaluar: (s) => s.totalCompletados >= 50 },
  { id: 'checks_100', nombre: 'Centurión', descripcion: '100 completados totales', icono: '🏆', condicion: '100 completados', evaluar: (s) => s.totalCompletados >= 100 },

  // ── Hábitos ──
  { id: 'habits_3', nombre: 'Malabarista', descripcion: 'Ten 3 hábitos activos', icono: '🤹', condicion: '3 hábitos', evaluar: (s) => s.totalHabitos >= 3 },
  { id: 'habits_5', nombre: 'Pentatleta', descripcion: 'Ten 5 hábitos activos', icono: '🏋️', condicion: '5 hábitos', evaluar: (s) => s.totalHabitos >= 5 },

  // ── Puntos ──
  { id: 'points_100', nombre: 'Cien Puntos', descripcion: 'Acumula 100 puntos', icono: '💯', condicion: '100 puntos', evaluar: (s) => s.totalPuntos >= 100 },
  { id: 'points_300', nombre: 'Ahorrador Vital', descripcion: 'Acumula 300 puntos', icono: '💎', condicion: '300 puntos', evaluar: (s) => s.totalPuntos >= 300 },
  { id: 'points_500', nombre: 'Medio Millar', descripcion: 'Acumula 500 puntos', icono: '🌟', condicion: '500 puntos', evaluar: (s) => s.totalPuntos >= 500 },
  { id: 'points_1000', nombre: 'Millar Dorado', descripcion: 'Acumula 1000 puntos', icono: '✨', condicion: '1000 puntos', evaluar: (s) => s.totalPuntos >= 1000 },

  // ── Journal ──
  { id: 'journal_first', nombre: 'Primeras Palabras', descripcion: 'Escribe tu primera entrada', icono: '🖋️', condicion: '1 entrada', evaluar: (s) => s.totalJournalEntries >= 1 },
  { id: 'journal_10', nombre: 'Escritor Recurrente', descripcion: '10 entradas en el diario', icono: '📚', condicion: '10 entradas', evaluar: (s) => s.totalJournalEntries >= 10 },
  { id: 'journal_30', nombre: 'Cronista de Vida', descripcion: '30 entradas en el diario', icono: '📜', condicion: '30 entradas', evaluar: (s) => s.totalJournalEntries >= 30 },

  // ── Tareas ──
  { id: 'tasks_10', nombre: 'Eficiente', descripcion: '10 tareas completadas', icono: '✅', condicion: '10 tareas', evaluar: (s) => s.totalTareasCompletadas >= 10 },
  { id: 'tasks_50', nombre: 'Productivo Máximo', descripcion: '50 tareas completadas', icono: '⚡', condicion: '50 tareas', evaluar: (s) => s.totalTareasCompletadas >= 50 },

  // ── Maestría ──
  { id: 'mood_perfect_5', nombre: 'Cumbre de Felicidad', descripcion: '5 días con ánimo excelente', icono: '🌈', condicion: '5 ánimos (5)', evaluar: (s) => s.totalAnimoPerfecto >= 5 },
  { id: 'sync_perfect', nombre: 'Sincronía Total', descripcion: 'Todos tus hábitos activos tienen racha', icono: '🌌', condicion: 'Todos racha > 0', evaluar: (s) => s.todosHabitosConRacha && s.totalHabitos > 0 },
];

// ─── Evaluador ───────────────────────────────────────────

/**
 * Evalúa qué badges nuevos se han desbloqueado.
 * Retorna un array de Badge (solo los nuevos, listos para persistir).
 */
export function evaluarBadges(
  stats: BadgeStats,
  badgesYaDesbloqueados: string[],
): Badge[] {
  const nuevos: Badge[] = [];

  for (const def of BADGE_DEFINITIONS) {
    if (badgesYaDesbloqueados.includes(def.id)) continue;

    if (def.evaluar(stats)) {
      nuevos.push({
        id: def.id,
        nombre: def.nombre,
        descripcion: def.descripcion,
        icono: def.icono,
        condicion: def.condicion,
        desbloqueadoEn: new Date().toISOString(),
      });
    }
  }

  return nuevos;
}
