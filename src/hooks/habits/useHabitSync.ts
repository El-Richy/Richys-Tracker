import { useEffect } from 'react';
import { useHabitStore, useAuthStore } from '../../store';
import { db } from '../../db';
import { calcularTotalPuntos } from '../../utils/pointsEngine';
import { scheduleHabitReminder } from '../../lib/notifications';

let loadedForUserId: string | null = null;

export function useHabitSync() {
  const user = useAuthStore((s) => s.user);
  const setHabits = useHabitStore((s) => s.setHabits);
  const setLogs = useHabitStore((s) => s.setLogs);
  const setBadges = useHabitStore((s) => s.setBadges);
  const setPointEntries = useHabitStore((s) => s.setPointEntries);
  const setTotalPoints = useHabitStore((s) => s.setTotalPoints);
  const setLoading = useHabitStore((s) => s.setLoading);

  useEffect(() => {
    if (!user) return;
    if (loadedForUserId === user.id) return;
    loadedForUserId = user.id;

    const initialize = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadLocalHabits(),
          loadLocalLogs(),
          loadLocalBadges(),
          loadLocalPoints()
        ]);
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [user]);

  async function loadLocalHabits() {
    if (!user) return;
    const local = await db.habits.where('userId').equals(user.id).toArray();
    setHabits(local);
    queueMicrotask(() => {
      local.forEach(h => {
        if (h.recordatorioHora) {
          void scheduleHabitReminder(h.id, h.nombre, h.recordatorioHora);
        }
      });
    });
  }

  async function loadLocalLogs() {
    const local = await db.habitLogs.toArray();
    setLogs(local);
  }

  async function loadLocalBadges() {
    const local = await db.badges.toArray();
    setBadges(local);
  }

  async function loadLocalPoints() {
    if (!user) return;
    const local = await db.pointEntries.where('userId').equals(user.id).toArray();
    setPointEntries(local);
    setTotalPoints(calcularTotalPuntos(local));
  }

  return { refresh: async () => {} };
}
