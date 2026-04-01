import { motion } from 'framer-motion';
import { useHabitStore } from '../../store';
import { BADGE_DEFINITIONS } from '../../utils/badges';

/**
 * Grid de badges — muestra todos los badges posibles.
 * Los desbloqueados tienen color y brillo, los bloqueados son grises.
 */
export function BadgeGrid() {
  const unlockedBadges = useHabitStore((s) => s.badges);
  const unlockedIds = new Set(unlockedBadges.map((b) => b.id));

  return (
    <motion.div
      className="bg-bg-card rounded-xl border border-border p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h3 className="text-sm font-semibold text-text-primary mb-3">
        🏆 Logros ({unlockedBadges.length}/{BADGE_DEFINITIONS.length})
      </h3>

      <div className="grid grid-cols-4 gap-3">
        {BADGE_DEFINITIONS.map((badge, i) => {
          const isUnlocked = unlockedIds.has(badge.id);

          return (
            <motion.div
              key={badge.id}
              className={`relative flex flex-col items-center text-center p-2 rounded-xl transition-colors ${
                isUnlocked
                  ? 'bg-bg-elevated'
                  : 'bg-bg-primary/50 opacity-40'
              }`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isUnlocked ? 1 : 0.4, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.03 }}
              title={`${badge.nombre}: ${badge.descripcion}`}
            >
              {/* Glow para desbloqueados */}
              {isUnlocked && (
                <div className="absolute inset-0 rounded-xl bg-accent/5 animate-pulse" />
              )}

              <span className={`text-2xl ${isUnlocked ? '' : 'grayscale'}`}>
                {badge.icono}
              </span>
              <p className="text-[9px] font-medium text-text-primary mt-1 leading-tight line-clamp-2">
                {badge.nombre}
              </p>
              <p className="text-[8px] text-text-secondary mt-0.5">
                {badge.condicion}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
