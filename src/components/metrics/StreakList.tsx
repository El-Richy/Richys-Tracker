import { motion } from 'framer-motion';
import { useHabitStore } from '../../store';
import type { EstadoRacha } from '../../types';

const ESTADO_CONFIG: Record<EstadoRacha, { emoji: string; label: string; color: string }> = {
  activa: { emoji: '🔥', label: 'Activa', color: '#F0611A' },
  en_riesgo: { emoji: '⚠️', label: 'En riesgo', color: '#F59E0B' },
  rota: { emoji: '💀', label: 'Rota', color: '#6B7280' },
};

/**
 * Lista de rachas por hábito con estado visual.
 */
export function StreakList() {
  const habits = useHabitStore((s) => s.habits);
  const streaks = useHabitStore((s) => s.streaks);

  if (habits.length === 0) {
    return null;
  }

  return (
    <motion.div
      className="bg-bg-card rounded-xl border border-border overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="text-sm font-semibold text-text-primary px-4 pt-4 pb-2">
        🔥 Rachas
      </h3>

      <div className="divide-y divide-border/50">
        {habits.map((habit, i) => {
          const streak = streaks.find((s) => s.habitId === habit.id);
          const rachaActual = streak?.rachaActual ?? 0;
          const rachaMaxima = streak?.rachaMaxima ?? 0;
          const estado = streak?.estado ?? 'rota';
          const config = ESTADO_CONFIG[estado];

          return (
            <motion.div
              key={habit.id}
              className="flex items-center gap-3 px-4 py-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            >
              {/* Icono del hábito */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                style={{ backgroundColor: `${habit.color}20` }}
              >
                {habit.icono}
              </div>

              {/* Nombre */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {habit.nombre}
                </p>
                <p className="text-[10px] text-text-secondary">
                  Máxima: {rachaMaxima} días
                </p>
              </div>

              {/* Racha actual + estado */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="text-lg font-bold"
                  style={{ color: config.color }}
                >
                  {rachaActual}
                </span>
                <span className="text-sm">{config.emoji}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
