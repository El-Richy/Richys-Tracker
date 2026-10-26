import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import type { MonthlyDataPoint } from '../../hooks/useChartData';
import { colors } from '../../theme/colors';

interface MonthlyChartProps {
  data: MonthlyDataPoint[];
}

/**
 * Gráfico de área suave — últimos 30 días, % de completitud.
 */
export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <motion.div
      className="bg-bg-card rounded-xl border border-border p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="text-sm font-semibold text-text-primary mb-4">
        Últimos 30 días
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--accent-rgb))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="rgb(var(--accent-rgb))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={colors.border}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: colors.textSecondary, fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: colors.textSecondary, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: colors.bgElevated,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              fontSize: 12,
              color: colors.textPrimary,
            }}
            formatter={(value: number) => [`${value}%`, 'Completitud']}
          />
          <Area
            type="monotone"
            dataKey="porcentaje"
            stroke="rgb(var(--accent-rgb))"
            strokeWidth={2}
            fill="url(#gradientArea)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
