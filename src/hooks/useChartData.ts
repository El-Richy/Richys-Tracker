import { useMemo } from 'react';
import { useHabitStore } from '../store';
import { getLocalDateStr, subtractDays, getDateRange, getDiaCorto, getFechaCorta, getDayOfWeekFromStr } from '../utils/dateUtils';

// ─── Tipos para gráficos ─────────────────────────────────

export interface WeeklyDataPoint {
  fecha: string;
  dia: string;
  total: number;
  [habitNombre: string]: string | number;
}

export interface MonthlyDataPoint {
  fecha: string;
  label: string;
  porcentaje: number;
}

/**
 * Hook que prepara datos para los gráficos de Recharts.
 * Lee directamente del Zustand store.
 */
export function useChartData() {
  const habits = useHabitStore((s) => s.habits);
  const logs = useHabitStore((s) => s.logs);

  // ─── Optimización: Mapa de logs para búsqueda rápida (O(1)) ───
  const logMap = useMemo(() => {
    const map = new Map<string, boolean>();
    logs.forEach((l) => {
      if (l.completado) {
        map.set(`${l.habitId}:${l.fecha}`, true);
      }
    });
    return map;
  }, [logs]);

  // ─── Datos semanales (BarChart apilado) ──────────────────

  const weeklyData = useMemo((): WeeklyDataPoint[] => {
    const hoy = getLocalDateStr();
    const hace7 = subtractDays(hoy, 6);
    const rango = getDateRange(hace7, hoy);

    return rango.map((fecha) => {
      const point: WeeklyDataPoint = {
        fecha,
        dia: getDiaCorto(fecha),
        total: 0,
      };

      for (const habit of habits) {
        const isCompletado = logMap.has(`${habit.id}:${fecha}`);
        const value = isCompletado ? 1 : 0;
        point[habit.nombre] = value;
        point.total += value;
      }

      return point;
    });
  }, [habits, logMap]);

  // ─── Datos mensuales (AreaChart de %) ────────────────────

  const monthlyData = useMemo((): MonthlyDataPoint[] => {
    const hoy = getLocalDateStr();
    const hace30 = subtractDays(hoy, 29);
    const rango = getDateRange(hace30, hoy);

    return rango.map((fecha) => {
      const dow = getDayOfWeekFromStr(fecha);

      // Hábitos activos para este día de la semana
      const habitosActivos = habits.filter((h) =>
        h.diasActivos.includes(dow),
      );

      if (habitosActivos.length === 0) {
        return { fecha, label: getFechaCorta(fecha), porcentaje: 100 };
      }

      const completados = habitosActivos.filter((h) =>
        logMap.has(`${h.id}:${fecha}`)
      ).length;

      const porcentaje = Math.round((completados / habitosActivos.length) * 100);

      return { fecha, label: getFechaCorta(fecha), porcentaje };
    });
  }, [habits, logMap]);

  // ─── Colores para barras ─────────────────────────────────

  const habitColors = useMemo(() => {
    return habits.map((h) => ({
      nombre: h.nombre,
      color: h.color,
    }));
  }, [habits]);

  // ─── Resumen del día ─────────────────────────────────────

  const resumenHoy = useMemo(() => {
    const hoy = getLocalDateStr();
    const dow = getDayOfWeekFromStr(hoy);

    const habitosHoy = habits.filter((h) => h.diasActivos.includes(dow));
    const completadosHoy = habitosHoy.filter((h) =>
      logMap.has(`${h.id}:${hoy}`)
    );

    return {
      totalHoy: habitosHoy.length,
      completadosHoy: completadosHoy.length,
      porcentajeHoy:
        habitosHoy.length > 0
          ? Math.round((completadosHoy.length / habitosHoy.length) * 100)
          : 100,
    };
  }, [habits, logMap]);

  return {
    weeklyData,
    monthlyData,
    habitColors,
    resumenHoy,
  };
}
