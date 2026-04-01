import { create } from 'zustand';
import type { JournalEntry } from '../types';

interface JournalState {
  entries: JournalEntry[];
  isLoading: boolean;
  
  setEntries: (entries: JournalEntry[]) => void;
  addEntry: (entry: JournalEntry) => void;
  updateEntry: (id: string, diff: Partial<JournalEntry>) => void;
  removeEntry: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useJournalStore = create<JournalState>((set) => ({
  entries: [],
  isLoading: true,

  setEntries: (entries) => set({ entries }),
  
  addEntry: (entry) =>
    set((state) => ({
      entries: [entry, ...state.entries],
    })),
    
  updateEntry: (id, diff) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...diff } : e)),
    })),
    
  removeEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    })),
    
  setLoading: (loading) => set({ isLoading: loading }),
}));
