import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useHabitStore } from '../../store';
import type { PointEntry } from '../../types';

interface PointsHistoryProps {
  /** Número máximo de entradas a mostrar. Default: 20. */
  limit?: number;
}

/**
 * Timeline del historial de puntos (entradas no ocultas, más recientes primero).
 * Muestra la razón legible (+2 por completar Meditación (racha ×2)) y el valor.
 */
export function PointsHistory({ limit = 20 }: PointsHistoryProps) {
  const pointEntries = useHabitStore((s) => s.pointEntries);

  const entries = useMemo<PointEntry[]>(() => {
    return [...pointEntries]
      .filter((e) => !e.oculto && e.puntos !== 0)
      .sort((a, b) => {
        // Ordenar por fecha desc; desempate por id para estabilidad.
        if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
        return a.id < b.id ? 1 : -1;
      })
      .slice(0, limit);
  }, [pointEntries, limit]);

  if (entries.length === 0) {
    return (
      <motion.div
        className="bg-bg-card rounded-xl border border-border p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-sm font-semibold text-text-primary mb-2">
          🪙 Historial de puntos
        </h3>
        <p className="text-xs text-text-secondary italic">
          Aún no has ganado puntos. Completa un hábito o tarea para empezar.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-bg-card rounded-xl border border-border p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-primary">
          🪙 Historial de puntos
        </h3>
        <span className="text-[10px] font-normal text-text-secondary uppercase tracking-widest">
          Últimas {entries.length}
        </span>
      </div>
      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {entries.map((entry) => {
          const fechaLabel = formatFechaCorta(entry.fecha);
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between text-xs gap-2 py-1.5 border-b border-border/40 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-text-primary truncate">{entry.razon}</p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {fechaLabel}
                </p>
              </div>
              <span
                className={`font-bold shrink-0 ${
                  entry.puntos >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {entry.puntos >= 0 ? '+' : ''}
                {entry.puntos}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/** Formatea "YYYY-MM-DD" como "14 jul" (locale es). */
function formatFechaCorta(fecha: string): string {
  try {
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
  } catch {
    return fecha;
  }
}