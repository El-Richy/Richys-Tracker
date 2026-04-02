import { useCallback, useEffect, useMemo } from 'react';
import { useRewardStore } from '../store/rewardStore';
import { useHabitStore, useAuthStore } from '../store';
import { db } from '../db';
import { supabase } from '../lib/supabase';
import { Reward, PointEntry } from '../types';
import { generateId } from '../utils/idUtils';

export function useRewards() {
  const {
    rewards,
    isLoading,
    setRewards,
    addReward: addRewardToStore,
    updateReward: updateRewardInStore,
    removeReward: removeRewardFromStore,
    setLoading,
  } = useRewardStore();

  const { totalPoints, addPointEntry } = useHabitStore();
  const user = useAuthStore((s) => s.user);

  const loadRewards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Carga desde Dexie
      const localRewards = await db.rewards.where('userId').equals(user.id).toArray();
      setRewards(localRewards);

      // 2. Sync desde Supabase (Maestro definitivo)
      const { data, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        const mapped = data.map(mapSupabaseReward);
        const remoteIds = new Set(mapped.map(r => r.id));

        // Limpiar en Dexie lo que ya no está en Supabase
        const toDelete = localRewards.filter(lr => !remoteIds.has(lr.id)).map(lr => lr.id);
        if (toDelete.length > 0) {
          await db.rewards.bulkDelete(toDelete);
        }

        // Actualizar/Insertar los de Supabase
        await db.rewards.bulkPut(mapped);
        setRewards(mapped);
      }
    } catch (err) {
      console.error('Error loading rewards:', err);
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setRewards]);

  useEffect(() => {
    if (user) {
      loadRewards();
    }
  }, [user, loadRewards]);

  const createReward = useCallback(async (data: Pick<Reward, 'nombre' | 'descripcion' | 'icono' | 'precioPuntos' | 'esRecurrente'>) => {
    if (!user) return;

    const reward: Reward = {
      id: generateId(),
      userId: user.id,
      nombre: data.nombre,
      descripcion: data.descripcion,
      icono: data.icono || '🎁',
      precioPuntos: data.precioPuntos,
      canjeada: false,
      esRecurrente: data.esRecurrente || false,
      creadoEn: new Date().toISOString(),
    };

    await db.rewards.add(reward);
    addRewardToStore(reward);

    supabase.from('rewards').insert({
      id: reward.id,
      user_id: reward.userId,
      nombre: reward.nombre,
      descripcion: reward.descripcion,
      icono: reward.icono,
      precio_puntos: reward.precioPuntos,
      canjeada: reward.canjeada,
      es_recurrente: reward.esRecurrente,
      creado_en: reward.creadoEn,
    }).then(({ error }) => {
      if (error) console.error('Sync create reward error:', error.message);
    });
  }, [user, addRewardToStore]);

  const deleteReward = useCallback(async (id: string) => {
    try {
      // 1. Borrar en Supabase primero (Confirmar con la nube)
      const { error } = await supabase.from('rewards').delete().eq('id', id);
      if (error) {
        console.error('Error al borrar recompensa en Supabase:', error.message);
      }

      // 2. Dexie
      await db.rewards.delete(id);

      // 3. Store
      removeRewardFromStore(id);
    } catch (err) {
      console.error('Local delete reward error:', err);
    }
  }, [removeRewardFromStore]);

  const canjearReward = useCallback(async (id: string) => {
    if (!user) return;
    const reward = rewards.find(r => r.id === id);
    if (!reward || totalPoints < reward.precioPuntos) return;

    // Lógica Mejora 3
    const canjeada = reward.canjeada;
    if (!reward.esRecurrente && canjeada) return;
    
    // Si es recurrente, checkear bloqueo de 7 días
    if (reward.esRecurrente && reward.ultimoCanjeo) {
      const diff = new Date().getTime() - new Date(reward.ultimoCanjeo).getTime();
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (dias < 7) return;
    }

    // 1. Marcar como canjeada / actualizar ultimo canjeo
    const updates: Partial<Reward> = {
      canjeada: !reward.esRecurrente,
      ultimoCanjeo: new Date().toISOString()
    };
    
    await db.rewards.update(id, updates);
    updateRewardInStore(id, updates);

    // 2. Restar puntos (crear entrada negativa)
    const entry: PointEntry = {
      id: generateId(),
      userId: user.id,
      fecha: new Date().toISOString().split('T')[0],
      puntos: -reward.precioPuntos,
      razon: `Canjeo de recompensa: ${reward.nombre}`,
    };
    
    await db.pointEntries.add(entry);
    addPointEntry(entry);

    // Sync
    supabase.from('rewards').update({ 
      canjeada: updates.canjeada,
      ultimo_canjeo: updates.ultimoCanjeo
    }).eq('id', id).then(({ error }) => {
      if (error) console.error('Sync canje reward error:', error.message);
    });

    supabase.from('point_entries').insert({
      id: entry.id,
      user_id: entry.userId,
      creado_en: entry.fecha,
      puntos: entry.puntos,
      razon: entry.razon,
    }).then(({ error }) => {
      if (error) console.error('Sync point entry error:', error.message);
    });

  }, [user, rewards, totalPoints, updateRewardInStore, addPointEntry]);

  // Helper Mejora 3
  const estaDisponible = useCallback((reward: Reward): boolean => {
    if (!reward.esRecurrente) return !reward.canjeada;
    if (!reward.ultimoCanjeo) return true;
    const diff = new Date().getTime() - new Date(reward.ultimoCanjeo).getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    return dias >= 7;
  }, []);

  const sortedRewards = useMemo(() => {
    return [...rewards].sort((a, b) => 
      new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
    );
  }, [rewards]);

  return {
    rewards: sortedRewards,
    isLoading,
    createReward,
    deleteReward,
    canjearReward,
    estaDisponible,
    loadRewards,
  };
}

interface SupabaseReward {
  id: string;
  user_id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  precio_puntos: number;
  canjeada: boolean;
  es_recurrente: boolean;
  ultimo_canjeo?: string;
  creado_en: string;
}

function mapSupabaseReward(row: SupabaseReward): Reward {
  return {
    id: row.id,
    userId: row.user_id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    icono: row.icono,
    precioPuntos: row.precio_puntos,
    canjeada: row.canjeada,
    esRecurrente: row.es_recurrente || false,
    ultimoCanjeo: row.ultimo_canjeo,
    creadoEn: row.creado_en,
  };
}
