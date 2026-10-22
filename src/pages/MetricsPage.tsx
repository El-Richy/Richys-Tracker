import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useChartData } from '../hooks/useChartData';
import { useHabitStore } from '../store';
import { DaySummary } from '../components/metrics/DaySummary';
import { WeeklyChart } from '../components/metrics/WeeklyChart';
import { MonthlyChart } from '../components/metrics/MonthlyChart';
import { StreakList } from '../components/metrics/StreakList';
import { BadgeGrid } from '../components/metrics/BadgeGrid';

type ChartView = 'semanal' | 'mensual';

interface MetricsPageProps {
  onBack?: () => void;
}

/**
 * Pantalla de métricas — KPIs, gráficos, rachas y badges.
 */
export function MetricsPage({ onBack }: MetricsPageProps) {
  const { weeklyData, monthlyData, habitColors, resumenHoy } = useChartData();
  const pointEntries = useHabitStore((s) => s.pointEntries);
  const [chartView, setChartView] = useState<ChartView>('semanal');

  const logs = useHabitStore((s) => s.logs);

  // Mejora 5: Mapa de calor de los últimos 35 días (5 semanas completas)
  const heatmapData = useMemo(() => {
    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (34 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = logs.filter((l) => l.fecha === dateStr && l.completado);
      return {
        count: dayLogs.length,
        date: d,
        dateStr,
      };
    });
  }, [logs]);

  const maxCount = useMemo(() => {
    return Math.max(...heatmapData.map((d: { count: number }) => d.count), 1);
  }, [heatmapData]);

  // Últimas 5 entradas de puntos (más recientes primero)
  const recentPoints = useMemo(() => {
    return [...pointEntries]
      .sort((a, b) => (a.fecha > b.fecha ? -1 : 1))
      .slice(0, 5);
  }, [pointEntries]);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
      {/* Header */}
      <div>
        {onBack && (
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 text-accent font-bold mb-4 hover:bg-accent/10 px-3 py-2 rounded-lg transition-colors"
          >
            ← Volver
          </button>
        )}
        <h1 className="text-2xl font-bold text-text-primary">Métricas</h1>
        <p className="text-sm text-text-secondary mt-1">
          Tus estadísticas y logros
        </p>
      </div>

      {/* KPIs del día */}
      <DaySummary resumenHoy={resumenHoy} />

      {/* Toggle semanal / mensual */}
      <div className="flex bg-bg-card rounded-xl border border-border p-1">
        {(['semanal', 'mensual'] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => setChartView(view)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              chartView === view
                ? 'bg-accent text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {view === 'semanal' ? '📊 Semanal' : '📈 Mensual'}
          </button>
        ))}
      </div>

      {/* Gráfico */}
      {chartView === 'semanal' ? (
        <WeeklyChart data={weeklyData} habitColors={habitColors} />
      ) : (
        <MonthlyChart data={monthlyData} />
      )}

      {/* Mejora 5: Mapa de calor de actividad */}
      <motion.div 
        className="bg-bg-card rounded-xl border border-border p-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center justify-between">
          <span>🔥 Intensidad de actividad</span>
          <span className="text-[10px] font-normal text-text-secondary uppercase tracking-widest">Últimos 35 días</span>
        </h3>
        
        <div className="grid grid-cols-7 gap-1.5 aspect-[7/5]">
          {heatmapData.map((day, idx) => {
            const intensity = day.count / maxCount;
            let bgColor = 'bg-bg-elevated';
            if (day.count > 0) {
              if (intensity <= 0.3) bgColor = 'bg-accent/20';
              else if (intensity <= 0.6) bgColor = 'bg-accent/50';
              else bgColor = 'bg-accent';
            }
            
            return (
              <div 
                key={idx}
                className={`w-full h-full rounded-[4px] transition-all duration-500 ${bgColor}`}
                title={`${day.dateStr}: ${day.count} hábitos`}
              />
            );
          })}
        </div>
        
        <div className="flex items-center justify-end gap-2 mt-4 text-[9px] text-text-secondary font-bold uppercase tracking-widest">
          <span>Menos</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-bg-elevated" />
            <div className="w-2.5 h-2.5 rounded-sm bg-accent/20" />
            <div className="w-2.5 h-2.5 rounded-sm bg-accent/50" />
            <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
          </div>
          <span>Más</span>
        </div>
      </motion.div>

      {/* Rachas */}
      <StreakList />

      {/* Logros */}
      <BadgeGrid />

      {/* Historial de puntos reciente */}
      {recentPoints.length > 0 && (
        <motion.div
          className="bg-bg-card rounded-xl border border-border p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            ⭐ Puntos recientes
          </h3>
          <div className="space-y-2">
            {recentPoints.length > 0 && recentPoints.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-text-secondary truncate flex-1 mr-2">
                  {entry.razon}
                </span>
                <span
                  className={`font-bold shrink-0 ${
                    entry.puntos >= 0 ? 'text-success' : 'text-danger'
                  }`}
                >
                  {entry.puntos >= 0 ? '+' : ''}
                  {entry.puntos}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Spacer para TabBar */}
      <div className="h-4" />
    </div>
  );
}
