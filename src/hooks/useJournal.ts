import { useCallback, useEffect, useMemo } from 'react';
import { useJournalStore } from '../store/journalStore';
import { useAuthStore } from '../store';
import { db } from '../db';
import type { JournalEntry } from '../types';
import { generateId } from '../utils/idUtils';

async function comprimirImagen(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 1200;
      let w = img.width, h = img.height;
      if (w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
      if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = base64;
  });
}

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

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const localEntries = await db.journalEntries.where('userId').equals(user.id).reverse().sortBy('creadoEn');
      setEntries(localEntries);
    } catch (err) {
      console.error('Error loading journal entries:', err);
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setEntries]);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user, loadEntries]);

  const createEntry = useCallback(async (data: Pick<JournalEntry, 'titulo' | 'texto' | 'estadoAnimo' | 'fotos'>) => {
    if (!user) return;

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

    await db.journalEntries.add(entry);
    addEntry(entry);
  }, [user, addEntry]);

  const deleteEntry = useCallback(async (id: string) => {
    try {
      await db.journalEntries.delete(id);
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

    await db.journalEntries.update(id, updates);
    updateEntryInStore(id, updates);
  }, [user, updateEntryInStore]);

  const editEntry = useCallback(async (id: string, data: Partial<JournalEntry>) => {
    if (!user) return;

    const updates: Partial<JournalEntry> = { ...data };
    if (data.fotos) {
      updates.fotos = await Promise.all(
        data.fotos.map(async (f) => (f.startsWith('data:image') ? await comprimirImagen(f) : f))
      );
    }

    await db.journalEntries.update(id, updates);
    updateEntryInStore(id, updates);
  }, [user, updateEntryInStore]);

  const getRecuerdoDeHoy = useCallback(() => {
    const hoy = new Date();
    const dia = hoy.getDate();
    const mes = hoy.getMonth();

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
