import { create } from 'zustand';
import type { Habit, HabitLog, Streak, Badge, PointEntry } from '../types';

interface HabitState {
  habits: Habit[];
  logs: HabitLog[];
  streaks: Streak[];
  badges: Badge[];
  pointEntries: PointEntry[];
  totalPoints: number;
  isLoading: boolean;

  // ─── Habits ──
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  removeHabit: (id: string) => void;

  // ─── Logs ──
  setLogs: (logs: HabitLog[]) => void;
  upsertLog: (log: HabitLog) => void;

  // ─── Streaks ──
  setStreaks: (streaks: Streak[]) => void;
  upsertStreak: (streak: Streak) => void;

  // ─── Badges ──
  setBadges: (badges: Badge[]) => void;
  addBadges: (badges: Badge[]) => void;
  markBadgeAsSeen: (id: string) => void;

  // ─── Points ──
  setPointEntries: (entries: PointEntry[]) => void;
  addPointEntry: (entry: PointEntry) => void;
  setTotalPoints: (total: number) => void;

  // ─── UI ──
  setLoading: (loading: boolean) => void;
}

export const useHabitStore = create<HabitState>()((set) => ({
  habits: [],
  logs: [],
  streaks: [],
  badges: [],
  pointEntries: [],
  totalPoints: 0,
  isLoading: false,

  // ─── Habits ────────────────────────────────────────────

  setHabits: (habits) => set({ habits }),

  addHabit: (habit) =>
    set((state) => ({ habits: [...state.habits, habit] })),

  updateHabit: (id, updates) =>
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, ...updates } : h
      ),
    })),

  removeHabit: (id) =>
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
      logs: state.logs.filter((l) => l.habitId !== id),
      streaks: state.streaks.filter((s) => s.habitId !== id),
    })),

  // ─── Logs ──────────────────────────────────────────────

  setLogs: (logs) => set({ logs }),

  upsertLog: (log) =>
    set((state) => {
      const existingIndex = state.logs.findIndex(
        (l) => l.habitId === log.habitId && l.fecha === log.fecha
      );
      if (existingIndex >= 0) {
        const updated = [...state.logs];
        updated[existingIndex] = log;
        return { logs: updated };
      }
      return { logs: [...state.logs, log] };
    }),

  // ─── Streaks ───────────────────────────────────────────

  setStreaks: (streaks) => set({ streaks }),

  upsertStreak: (streak) =>
    set((state) => {
      const existingIndex = state.streaks.findIndex(
        (s) => s.habitId === streak.habitId
      );
      if (existingIndex >= 0) {
        const updated = [...state.streaks];
        updated[existingIndex] = streak;
        return { streaks: updated };
      }
      return { streaks: [...state.streaks, streak] };
    }),

  // ─── Badges ────────────────────────────────────────────

  setBadges: (badges) => set({ badges }),

  addBadges: (newBadges) =>
    set((state) => {
      const existingIds = new Set(state.badges.map(b => b.id));
      const filtered = newBadges.filter(b => !existingIds.has(b.id));
      if (filtered.length === 0) return state;
      // Los nuevos badges se inicializan con visto: false
      const withSeen = filtered.map(b => ({ ...b, visto: false }));
      return { badges: [...state.badges, ...withSeen] };
    }),

  markBadgeAsSeen: (id) =>
    set((state) => ({
      badges: state.badges.map((b) =>
        b.id === id ? { ...b, visto: true } : b
      ),
    })),

  // ─── Points ────────────────────────────────────────────

  setPointEntries: (pointEntries) => set({ pointEntries }),

  addPointEntry: (entry) =>
    set((state) => ({
      pointEntries: [...state.pointEntries, entry],
      totalPoints: Math.max(0, state.totalPoints + entry.puntos),
    })),

  setTotalPoints: (totalPoints) => set({ totalPoints }),

  // ─── UI ────────────────────────────────────────────────

  setLoading: (isLoading) => set({ isLoading }),
}));
