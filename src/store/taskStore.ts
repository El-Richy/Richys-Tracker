import { create } from 'zustand';
import type { Task } from '../types';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, diff: Partial<Task>) => void;
  removeTask: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  isLoading: true,

  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),
    
  updateTask: (id, diff) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...diff } : t)),
    })),
    
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
    
  setLoading: (loading) => set({ isLoading: loading }),
}));
