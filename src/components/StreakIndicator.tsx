import { motion } from 'framer-motion';
import type { Streak } from '../types';

interface StreakIndicatorProps {
  streak: Streak | null;
}

/**
 * Mini indicador de racha para la HabitCard.
 * 🔥 N activa | ⚠️ N en riesgo | nada si rota
 */
export function StreakIndicator({ streak }: StreakIndicatorProps) {
  if (!streak || streak.rachaActual === 0) return null;

  const isAtRisk = streak.estado === 'en_riesgo';

  return (
    <motion.div
      className={`flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
        isAtRisk
          ? 'bg-amber-500/15 text-amber-400'
          : 'bg-orange-500/15 text-orange-400'
      }`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
    >
      {isAtRisk ? (
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ⚠️
        </motion.span>
      ) : (
        <span>🔥</span>
      )}
      <span>{streak.rachaActual}</span>
    </motion.div>
  );
}
