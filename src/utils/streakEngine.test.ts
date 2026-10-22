import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calcularRacha } from './streakEngine';
import type { Habit } from '../types';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    userId: 'user-1',
    nombre: 'Test Habit',
    color: '#F0611A',
    icono: '💪',
    recordatorioHora: null,
    diasActivos: [1, 2, 3, 4, 5], // Lunes a viernes
    diasGracia: 0,
    creadoEn: new Date().toISOString(),
    subtareas: [],
    prioridad: 'media',
    ...overrides,
  };
}

describe('streakEngine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns rota when no completed days', () => {
    vi.setSystemTime(new Date('2026-07-21T12:00:00')); // martes
    const habit = makeHabit({ diasActivos: [2] }); // solo martes

    const streak = calcularRacha(habit, new Set());

    expect(streak.rachaActual).toBe(0);
    expect(streak.estado).toBe('rota');
    expect(streak.rachaMaxima).toBe(0);
  });

  it('counts today as streak of 1 when today is active and completed', () => {
    vi.setSystemTime(new Date('2026-07-21T12:00:00'));
    const habit = makeHabit({ diasActivos: [2] }); // martes
    const fechas = new Set(['2026-07-21']);

    const streak = calcularRacha(habit, fechas);

    expect(streak.rachaActual).toBe(1);
    expect(streak.estado).toBe('activa');
  });

  it('counts consecutive active days', () => {
    vi.setSystemTime(new Date('2026-07-21T12:00:00'));
    const habit = makeHabit({ diasActivos: [1, 2, 3, 4, 5] });
    const fechas = new Set(['2026-07-20', '2026-07-21']);

    const streak = calcularRacha(habit, fechas);

    expect(streak.rachaActual).toBe(2);
    expect(streak.estado).toBe('activa');
  });

  it('uses grace days without breaking streak', () => {
    vi.setSystemTime(new Date('2026-07-15T12:00:00')); // miércoles
    const habit = makeHabit({ diasActivos: [1, 2, 3], diasGracia: 1 }); // Lunes, martes, miércoles
    const fechas = new Set(['2026-07-13', '2026-07-15']); // Mon, Wed (Tue skipped)

    const streak = calcularRacha(habit, fechas);

    expect(streak.rachaActual).toBe(2); // Mon + Wed counted
    expect(streak.estado).toBe('activa');
  });

  it('breaks streak when grace days exceeded', () => {
    vi.setSystemTime(new Date('2026-07-15T12:00:00'));
    const habit = makeHabit({ diasActivos: [1, 2, 3], diasGracia: 0 });
    // Monday and Wednesday active, Tuesday active but skipped -> break
    const fechas = new Set(['2026-07-13', '2026-07-15']);

    const streak = calcularRacha(habit, fechas);

    // Wednesday counted; streak is active because today is completed and active
    expect(streak.rachaActual).toBe(1);
    expect(streak.estado).toBe('activa');
  });

  it('marks en_riesgo when today is active and not completed but yesterday was', () => {
    vi.setSystemTime(new Date('2026-07-21T12:00:00'));
    const habit = makeHabit({ diasActivos: [1, 2, 3, 4, 5] });
    const fechas = new Set(['2026-07-20']);

    const streak = calcularRacha(habit, fechas);

    expect(streak.rachaActual).toBe(1);
    expect(streak.estado).toBe('en_riesgo');
  });

  it('preserves max streak from previous calculation', () => {
    vi.setSystemTime(new Date('2026-07-21T12:00:00'));
    const habit = makeHabit({ diasActivos: [1, 2, 3, 4, 5] });
    const fechas = new Set(['2026-07-21']);

    const streak = calcularRacha(habit, fechas, 10, '');

    expect(streak.rachaMaxima).toBe(10);
  });
});
