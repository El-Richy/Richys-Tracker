import Dexie, { type Table } from 'dexie';
import type { Habit, HabitLog, Streak, Points, Badge, PointEntry, Task, JournalEntry, Reward } from '../types';

/**
 * Base de datos local con Dexie (IndexedDB).
 * Actúa como caché offline — Supabase es la fuente de verdad.
 */
export class TrackerDB extends Dexie {
  habits!: Table<Habit, string>;
  habitLogs!: Table<HabitLog, string>;
  streaks!: Table<Streak, string>;
  points!: Table<Points, string>;
  badges!: Table<Badge, string>;
  pointEntries!: Table<PointEntry, string>;
  tasks!: Table<Task, string>;
  journalEntries!: Table<JournalEntry, string>;
  rewards!: Table<Reward, string>;

  constructor() {
    super('RichysTrackerDB');

    this.version(1).stores({
      habits: 'id, userId, nombre',
      habitLogs: 'id, habitId, fecha, [habitId+fecha]',
      streaks: 'habitId',
      points: 'userId',
      badges: 'id',
    });

    // v2: añade pointEntries para historial detallado de puntos
    this.version(2).stores({
      habits: 'id, userId, nombre',
      habitLogs: 'id, habitId, fecha, [habitId+fecha]',
      streaks: 'habitId',
      points: 'userId',
      badges: 'id',
      pointEntries: 'id, userId, habitId, fecha',
    });

    // v3: añade tasks y journalEntries
    this.version(3).stores({
      habits: 'id, userId, nombre',
      habitLogs: 'id, habitId, fecha, [habitId+fecha]',
      streaks: 'habitId',
      points: 'userId',
      badges: 'id',
      pointEntries: 'id, userId, habitId, fecha',
      tasks: 'id, userId, completada, prioridad',
      journalEntries: 'id, userId, creadoEn',
    });

    // v4: añade titulo opcional a journalEntries (ya incluido en el objeto, no necesita index)
    this.version(4).stores({
      habits: 'id, userId, nombre',
      habitLogs: 'id, habitId, fecha, [habitId+fecha]',
      streaks: 'habitId',
      points: 'userId',
      badges: 'id',
      pointEntries: 'id, userId, habitId, fecha',
      tasks: 'id, userId, completada, prioridad',
      journalEntries: 'id, userId, creadoEn',
    });

    // v5: añade rewards
    this.version(5).stores({
      habits: 'id, userId, nombre',
      habitLogs: 'id, habitId, fecha, [habitId+fecha]',
      streaks: 'habitId',
      points: 'userId',
      badges: 'id',
      pointEntries: 'id, userId, habitId, fecha',
      tasks: 'id, userId, completada, prioridad',
      journalEntries: 'id, userId, creadoEn',
      rewards: 'id, userId, canjeada',
    });

    // v6: añade esRecurrente y ultimoCanjeo a rewards
    this.version(6).stores({
      habits: 'id, userId, nombre',
      habitLogs: 'id, habitId, fecha, [habitId+fecha]',
      streaks: 'habitId',
      points: 'userId',
      badges: 'id',
      pointEntries: 'id, userId, habitId, fecha',
      tasks: 'id, userId, completada, prioridad',
      journalEntries: 'id, userId, creadoEn',
      rewards: 'id, userId, canjeada, esRecurrente',
    });

    // v7: añade índice compuesto [habitId+fecha] en pointEntries para el sistema anti-cheat
    this.version(7).stores({
      habits: 'id, userId, nombre',
      habitLogs: 'id, habitId, fecha, [habitId+fecha]',
      streaks: 'habitId',
      points: 'userId',
      badges: 'id',
      pointEntries: 'id, userId, habitId, fecha, [habitId+fecha]',
      tasks: 'id, userId, completada, prioridad',
      journalEntries: 'id, userId, creadoEn',
      rewards: 'id, userId, canjeada, esRecurrente',
    });
  }
}

export const db = new TrackerDB();
