import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import type { WeeklyDataPoint } from '../../hooks/useChartData';
import { colors } from '../../theme/colors';

interface WeeklyChartProps {
  data: WeeklyDataPoint[];
  habitColors: { nombre: string; color: string }[];
}

/**
 * Gráfico de barras apiladas — últimos 7 días.
 * Cada barra muestra qué hábitos se completaron ese día.
 */
export function WeeklyChart({ data, habitColors }: WeeklyChartProps) {
  if (habitColors.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary text-sm">
        Crea un hábito para ver tus estadísticas semanales
      </div>
    );
  }

  return (
    <motion.div
      className="bg-bg-card rounded-xl border border-border p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        Última semana
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.border}
            vertical={false}
          />
          <XAxis
            dataKey="dia"
            tick={{ fill: colors.textSecondary, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: colors.textSecondary, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={20}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.bgElevated,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              fontSize: 12,
              color: colors.textPrimary,
            }}
            cursor={{ fill: `${colors.accent}10` }}
          />
          {habitColors.map(({ nombre, color }) => (
            <Bar
              key={nombre}
              dataKey={nombre}
              stackId="habits"
              fill={color}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
