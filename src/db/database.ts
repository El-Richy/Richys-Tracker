import Dexie, { type Table } from 'dexie';
import type { Habit, HabitLog, Streak, Badge, PointEntry, Task, JournalEntry } from '../types';

export class TrackerDB extends Dexie {
  habits!: Table<Habit, string>;
  habitLogs!: Table<HabitLog, string>;
  streaks!: Table<Streak, string>;
  badges!: Table<Badge, string>;
  pointEntries!: Table<PointEntry, string>;
  tasks!: Table<Task, string>;
  journalEntries!: Table<JournalEntry, string>;

  constructor() {
    super('RichysTrackerDB');

    this.version(1).stores({
      habits: 'id, userId, nombre',
      habitLogs: 'id, habitId, fecha, [habitId+fecha]',
      streaks: 'habitId',
      badges: 'id',
    });

    this.version(2).stores({
      habits: 'id, userId, nombre',
      habitLogs: 'id, habitId, fecha, [habitId+fecha]',
      streaks: 'habitId',
      badges: 'id',
      pointEntries: 'id, userId, habitId, fecha',
    });

    this.version(3).stores({
      habits: 'id, userId, nombre',
      habitLogs: 'id, habitId, fecha, [habitId+fecha]',
      streaks: 'habitId',
      badges: 'id',
      pointEntries: 'id, userId, habitId, fecha',
      tasks: 'id, userId, completada, prioridad',
      journalEntries: 'id, userId, creadoEn',
    });

    this.version(4).stores({
      habits: 'id, userId, nombre',
      habitLogs: 'id, habitId, fecha, [habitId+fecha]',
      streaks: 'habitId',
      badges: 'id',
      pointEntries: 'id, userId, habitId, fecha',
      tasks: 'id, userId, completada, prioridad',
      journalEntries: 'id, userId, creadoEn',
    });

    this.version(5).stores({
      habits: 'id, userId, nombre',
      habitLogs: 'id, habitId, fecha, [habitId+fecha]',
      streaks: 'habitId',
      badges: 'id',
      pointEntries: 'id, userId, habitId, fecha',
      tasks: 'id, userId, completada, prioridad',
      journalEntries: 'id, userId, creadoEn',
    });

    this.version(6).stores({
      habits: 'id, userId, nombre',
      habitLogs: 'id, habitId, fecha, [habitId+fecha]',
      streaks: 'habitId',
      badges: 'id',
      pointEntries: 'id, userId, habitId, fecha, [habitId+fecha]',
      tasks: 'id, userId, completada, prioridad',
      journalEntries: 'id, userId, creadoEn',
    });
  }
}

export const db = new TrackerDB();
