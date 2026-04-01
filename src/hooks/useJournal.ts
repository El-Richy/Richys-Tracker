import { useCallback, useEffect, useMemo } from 'react';
import { useJournalStore } from '../store/journalStore';
import { useAuthStore } from '../store';
import { db } from '../db';
import { supabase } from '../lib/supabase';
import type { JournalEntry } from '../types';
import { generateId } from '../utils/idUtils';

/**
 * Función de compresión de imagen con Canvas (según especificación).
 */
async function comprimirImagen(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 800;
      let w = img.width, h = img.height;
      if (w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
      if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = base64;
  });
}

/**
 * Hook para el CRUD de Journal con patrón offline-first.
 * Dexie (Local + Fotos) -> Store -> Supabase (Sync sin fotos).
 */
export function useJournal() {
  const {
    entries,
    isLoading,
    setEntries,
    addEntry,
    removeEntry,
    setLoading,
    updateEntry: updateEntryInStore,
  } = useJournalStore();

  const user = useAuthStore((s) => s.user);

  // ─── Cargar datos al montar ────────────────────────────────

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  // ─── Loaders ───────────────────────────────────────────────

  async function loadEntries() {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Cargar desde Dexie
      const localEntries = await db.journalEntries.where('userId').equals(user.id).reverse().sortBy('creadoEn');
      setEntries(localEntries);

      // 2. Sync desde Supabase (Maestro definitivo)
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        const mapped = data.map(mapSupabaseJournalEntry);
        const remoteIds = new Set(mapped.map(e => e.id));

        // Limpiar en Dexie lo que ya no está en Supabase
        const toDelete = localEntries.filter(le => !remoteIds.has(le.id)).map(le => le.id);
        if (toDelete.length > 0) {
          await db.journalEntries.bulkDelete(toDelete);
        }

        // Mantener fotos locales al sincronizar
        for (const remote of mapped) {
          const local = localEntries.find(le => le.id === remote.id);
          if (local && local.fotos && local.fotos.length > 0) {
            remote.fotos = local.fotos;
          }
        }

        await db.journalEntries.bulkPut(mapped);
        setEntries(mapped.sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)));
      }
    } catch (err) {
      console.error('Error loading journal entries:', err);
    } finally {
      setLoading(false);
    }
  }

  // ─── CRUD ──────────────────────────────────────────────────

  const createEntry = useCallback(async (data: Pick<JournalEntry, 'titulo' | 'texto' | 'estadoAnimo' | 'fotos'>) => {
    if (!user) return;

    // Comprimir fotos antes de guardar
    const fotosComprimidas = await Promise.all(
        data.fotos.map(f => comprimirImagen(f))
    );

    const entry: JournalEntry = {
      id: generateId(),
      userId: user.id,
      titulo: data.titulo,
      texto: data.texto,
      estadoAnimo: data.estadoAnimo,
      fotos: fotosComprimidas,
      creadoEn: new Date().toISOString(),
      tipo: data.estadoAnimo ? 'journal' : 'note',
    };

    // 1. Dexie
    await db.journalEntries.add(entry);
    // 2. Store
    addEntry(entry);
    // 3. Supabase Sync (fotos: [])
    supabase.from('journal_entries').insert({
      id: entry.id,
      user_id: entry.userId,
      titulo: entry.titulo || null,
      texto: entry.texto,
      estado_animo: entry.estadoAnimo || null,
      fotos: [], 
      creado_en: entry.creadoEn,
      tipo: entry.tipo,
    }).then(({ error }) => {
      if (error) console.error('Sync create journal entry error:', error.message);
    });
  }, [user, addEntry]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      // 1. Borrado en Supabase primero (Confirmar con la nube)
      const { error } = await supabase.from('journal_entries').delete().eq('id', id);
      if (error) {
        console.error('Error al borrar entrada de diario en Supabase:', error.message);
      }

      // 2. Dexie
      await db.journalEntries.delete(id);

      // 3. Store
      removeEntry(id);
    } catch (err) {
      console.error('Local delete journal entry error:', err);
    }
  }, [removeEntry]);

  const incrustarNotaEnJournal = useCallback(async (id: string, estadoAnimo: 1 | 2 | 3 | 4 | 5) => {
     if (!user) return;
 
     const updates = {
       estadoAnimo,
       tipo: 'journal' as const,
     };
 
     // 1. Dexie
     await db.journalEntries.update(id, updates);
     // 2. Store
     updateEntryInStore(id, updates);
     // 3. Supabase
     supabase.from('journal_entries').update({
       estado_animo: estadoAnimo,
       tipo: 'journal'
     }).eq('id', id).then(({ error }) => {
       if (error) console.error('Sync embed note error:', error.message);
     });
   }, [user, updateEntryInStore]);
 
   const editEntry = useCallback(async (id: string, data: Partial<JournalEntry>) => {
    if (!user) return;

    const updates: any = { ...data };
    if (data.fotos) {
      // Solo comprimir las que son nuevas (base64 recién capturado)
      updates.fotos = await Promise.all(
        data.fotos.map(async (f) => (f.startsWith('data:image') ? await comprimirImagen(f) : f))
      );
    }

    // 1. Dexie
    await db.journalEntries.update(id, updates);
    // 2. Store
    updateEntryInStore(id, updates);
    // 3. Supabase
    supabase.from('journal_entries').update({
      titulo: updates.titulo ?? null,
      texto: updates.texto,
      estado_animo: updates.estadoAnimo,
      fotos: [],
    }).eq('id', id).then(({ error }) => {
      if (error) console.error('Sync edit journal entry error:', error.message);
    });
  }, [user, updateEntryInStore]);

  const getRecuerdoDeHoy = useCallback(() => {
    const hoy = new Date();
    const dia = hoy.getDate();
    const mes = hoy.getMonth();
    
    // Buscar entradas de años anteriores con mismo día y mismo mes
    const recuerdos = entries.filter(e => {
      const d = new Date(e.creadoEn);
      return d.getDate() === dia && 
             d.getMonth() === mes && 
             d.getFullYear() < hoy.getFullYear();
    });
    
    if (recuerdos.length === 0) return null;
    return recuerdos[0]; 
  }, [entries]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => 
      new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
    );
  }, [entries]);

  return {
    entries: sortedEntries,
    isLoading,
    createEntry,
    editEntry,
    deleteEntry,
    loadEntries,
    getRecuerdoDeHoy,
    comprimirImagen, 
    incrustarNotaEnJournal,
  };
}


// ─── Mapper ───────────────────────────────────────────────

function mapSupabaseJournalEntry(row: any): JournalEntry {
  return {
    id: row.id,
    userId: row.user_id,
    titulo: row.titulo || undefined,
    texto: row.texto,
    estadoAnimo: row.estado_animo || undefined,
    fotos: row.fotos || [],
    creadoEn: row.creado_en,
    tipo: row.tipo || 'journal',
  };
}
