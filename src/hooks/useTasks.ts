import { useCallback, useEffect, useMemo } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store';
import { db } from '../db';
import { supabase } from '../lib/supabase';
import { Task } from '../types';
import { generateId } from '../utils/idUtils';

/**
 * Hook para el CRUD de tareas con patrón offline-first.
 * Dexie (Local) -> Store (Zustand) -> Supabase (Sync).
 */
export function useTasks() {
  const {
    tasks,
    isLoading,
    setTasks,
    addTask: addTaskToStore,
    updateTask: updateTaskInStore,
    removeTask: removeTaskFromStore,
    setLoading,
  } = useTaskStore();

  const user = useAuthStore((s) => s.user);

  // ─── Cargar datos al montar ────────────────────────────────

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  // ─── Loaders ───────────────────────────────────────────────

  async function loadTasks() {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Cargar desde Dexie
      const localTasks = await db.tasks.where('userId').equals(user.id).toArray();
      setTasks(localTasks);

      // 2. Sync desde Supabase
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) {
        const mapped = data.map(mapSupabaseTask);
        await db.tasks.bulkPut(mapped);
        setTasks(mapped);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }

  // ─── CRUD ──────────────────────────────────────────────────

  const createTask = useCallback(async (data: Pick<Task, 'titulo' | 'descripcion' | 'prioridad' | 'deadline' | 'subtareas'>) => {
    if (!user) return;

    const task: Task = {
      id: generateId(),
      userId: user.id,
      titulo: data.titulo,
      descripcion: data.descripcion,
      completada: false,
      prioridad: data.prioridad,
      deadline: data.deadline,
      subtareas: data.subtareas,
      creadoEn: new Date().toISOString(),
    };

    // 1. Dexie
    await db.tasks.add(task);
    // 2. Store
    addTaskToStore(task);
    // 3. Supabase Sync
    supabase.from('tasks').insert({
      id: task.id,
      user_id: task.userId,
      titulo: task.titulo,
      descripcion: task.descripcion,
      completada: task.completada,
      prioridad: task.prioridad,
      deadline: task.deadline || null,
      subtareas: task.subtareas,
      creado_en: task.creadoEn,
    }).then(({ error }) => {
      if (error) console.error('Sync create task error:', error.message);
    });
  }, [user, addTaskToStore]);

  const editTask = useCallback(async (id: string, updates: Partial<Task>) => {
    // 1. Dexie
    await db.tasks.update(id, updates);
    // 2. Store
    updateTaskInStore(id, updates);
    // 3. Supabase Sync
    const sbUpdates: any = {};
    if (updates.titulo !== undefined) sbUpdates.titulo = updates.titulo;
    if (updates.descripcion !== undefined) sbUpdates.descripcion = updates.descripcion;
    if (updates.completada !== undefined) sbUpdates.completada = updates.completada;
    if (updates.prioridad !== undefined) sbUpdates.prioridad = updates.prioridad;
    if (updates.deadline !== undefined) sbUpdates.deadline = updates.deadline || null;
    if (updates.subtareas !== undefined) sbUpdates.subtareas = updates.subtareas;

    supabase.from('tasks')
      .update(sbUpdates)
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.error('Sync update task error:', error.message);
      });
  }, [updateTaskInStore]);

  const deleteTask = useCallback(async (id: string) => {
    // 1. Dexie
    await db.tasks.delete(id);
    // 2. Store
    removeTaskFromStore(id);
    // 3. Supabase Sync
    supabase.from('tasks').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Sync delete task error:', error.message);
    });
  }, [removeTaskFromStore]);

  const toggleTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const nuevoEstado = !task.completada;
    await editTask(id, { completada: nuevoEstado });
  }, [tasks, editTask]);

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtareas.map(s => {
      if (s.id === subtaskId) {
        return { ...s, completada: !s.completada };
      }
      return s;
    });

    const totalSubtasks = updatedSubtasks.length;
    const completedSubtasksCount = updatedSubtasks.filter(s => s.completada).length;
    
    // Auto-complete logic: todas listas -> tarea completa. 
    // Una sola pendiente -> tarea pendiente.
    const parentCompletada = totalSubtasks > 0 ? (completedSubtasksCount === totalSubtasks) : task.completada;

    await editTask(taskId, { 
      subtareas: updatedSubtasks,
      completada: parentCompletada 
    });
  }, [tasks, editTask]);

  const addSubtask = useCallback(async (taskId: string, subtaskName: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtask = {
      id: generateId(),
      nombre: subtaskName,
      completada: false
    };

    const updatedSubtasks = [...task.subtareas, newSubtask];

    // Al añadir una nueva subtarea (que viene pendiente), 
    // la tarea padre DEBE estar pendiente si no lo estaba ya.
    await editTask(taskId, { 
      subtareas: updatedSubtasks,
      completada: false 
    });
  }, [tasks, editTask]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => 
      new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
    );
  }, [tasks]);

  return {
    tasks: sortedTasks,
    isLoading,
    createTask,
    editTask,
    deleteTask,
    toggleTask,
    toggleSubtask,
    addSubtask,
    loadTasks,
  };
}

// ─── Mapper ───────────────────────────────────────────────

function mapSupabaseTask(row: any): Task {
  return {
    id: row.id,
    userId: row.user_id,
    titulo: row.titulo,
    descripcion: row.descripcion || '',
    completada: row.completada,
    prioridad: row.prioridad as Task['prioridad'],
    deadline: row.deadline || undefined,
    subtareas: row.subtareas || [],
    creadoEn: row.creado_en,
  };
}
