import { motion } from 'framer-motion';
import { useHabitStore } from '../../store';
import type { useChartData } from '../../hooks/useChartData';

interface DaySummaryProps {
  resumenHoy: ReturnType<typeof useChartData>['resumenHoy'];
}

/**
 * Tarjetas KPI del día: % completado, racha más larga activa, puntos totales.
 */
export function DaySummary({ resumenHoy }: DaySummaryProps) {
  const streaks = useHabitStore((s) => s.streaks);
  const totalPoints = useHabitStore((s) => s.totalPoints);

  const rachaMaxActiva = streaks.reduce(
    (max, s) => Math.max(max, s.rachaActual),
    0,
  );

  const cards = [
    {
      label: 'Hoy',
      value: `${resumenHoy.completadosHoy}/${resumenHoy.totalHoy}`,
      subtext: `${resumenHoy.porcentajeHoy}% Completado`,
      icon: '📋',
      color: 'rgb(var(--accent-rgb))',
    },
    {
      label: 'Racha',
      value: `${rachaMaxActiva}`,
      subtext: rachaMaxActiva > 0 ? 'Días Seguidos' : 'Empieza Hoy',
      icon: '🔥',
      color: '#EF4444',
    },
    {
      label: 'Puntos',
      value: `${totalPoints}`,
      subtext: 'Acumulados',
      icon: '⭐',
      color: '#F59E0B',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          className="relative overflow-hidden rounded-xl border border-border bg-bg-card p-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          {/* Glow de fondo */}
          <div
            className="absolute -top-2 -right-2 w-12 h-12 rounded-full opacity-10 blur-xl"
            style={{ backgroundColor: card.color }}
          />

          <span className="text-lg">{card.icon}</span>
          <p
            className="text-xl font-bold mt-1"
            style={{ color: card.color }}
          >
            {card.value}
          </p>
          <p className="text-[10px] text-text-secondary mt-0.5 leading-tight">
            {card.subtext}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
