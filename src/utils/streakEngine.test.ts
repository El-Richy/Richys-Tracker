import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { calcularRacha } from './streakEngine.ts';
import type { Habit } from '../types';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    userId: 'user-1',
    nombre: 'Test Habit',
    color: '#F0611A',
    icono: '💪',
    recordatorioHora: null,
    diasActivos: [1, 2, 3, 4, 5],
    diasGracia: 0,
    creadoEn: new Date().toISOString(),
    subtareas: [],
    prioridad: 'media',
    ...overrides,
  };
}

function at(isoLocal: string, run: () => void): void {
  mock.timers.enable({ apis: ['Date'], now: new Date(isoLocal) });
  try {
    run();
  } finally {
    mock.timers.reset();
  }
}

describe('streakEngine', () => {
  afterEach(() => {
    mock.timers.reset();
  });

  it('returns rota when no completed days', () => {
    at('2026-07-21T12:00:00', () => {
      const habit = makeHabit({ diasActivos: [2] });
      const streak = calcularRacha(habit, new Set());
      assert.equal(streak.rachaActual, 0);
      assert.equal(streak.estado, 'rota');
      assert.equal(streak.rachaMaxima, 0);
    });
  });

  it('counts today as streak of 1 when today is active and completed', () => {
    at('2026-07-21T12:00:00', () => {
      const habit = makeHabit({ diasActivos: [2] });
      const streak = calcularRacha(habit, new Set(['2026-07-21']));
      assert.equal(streak.rachaActual, 1);
      assert.equal(streak.estado, 'activa');
    });
  });

  it('counts consecutive active days', () => {
    at('2026-07-21T12:00:00', () => {
      const habit = makeHabit({ diasActivos: [1, 2, 3, 4, 5] });
      const streak = calcularRacha(habit, new Set(['2026-07-20', '2026-07-21']));
      assert.equal(streak.rachaActual, 2);
      assert.equal(streak.estado, 'activa');
    });
  });

  it('uses grace days without breaking streak', () => {
    at('2026-07-15T12:00:00', () => {
      const habit = makeHabit({ diasActivos: [1, 2, 3], diasGracia: 1 });
      const streak = calcularRacha(habit, new Set(['2026-07-13', '2026-07-15']));
      assert.equal(streak.rachaActual, 2);
      assert.equal(streak.estado, 'activa');
    });
  });

  it('breaks streak when grace days exceeded', () => {
    at('2026-07-15T12:00:00', () => {
      const habit = makeHabit({ diasActivos: [1, 2, 3], diasGracia: 0 });
      const streak = calcularRacha(habit, new Set(['2026-07-13', '2026-07-15']));
      assert.equal(streak.rachaActual, 1);
      assert.equal(streak.estado, 'activa');
    });
  });

  it('marks en_riesgo when today is active and not completed but yesterday was', () => {
    at('2026-07-21T12:00:00', () => {
      const habit = makeHabit({ diasActivos: [1, 2, 3, 4, 5] });
      const streak = calcularRacha(habit, new Set(['2026-07-20']));
      assert.equal(streak.rachaActual, 1);
      assert.equal(streak.estado, 'en_riesgo');
    });
  });

  it('preserves max streak from previous calculation', () => {
    at('2026-07-21T12:00:00', () => {
      const habit = makeHabit({ diasActivos: [1, 2, 3, 4, 5] });
      const streak = calcularRacha(habit, new Set(['2026-07-21']), 10);
      assert.equal(streak.rachaMaxima, 10);
    });
  });
});
