import { useCallback, useEffect, useMemo } from 'react';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store';
import { db } from '../db';
import { Task } from '../types';
import { generateId } from '../utils/idUtils';
import { scheduleTaskReminder, cancelReminders } from '../lib/notifications';

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

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const localTasks = await db.tasks.where('userId').equals(user.id).toArray();
      setTasks(localTasks);
      localTasks.forEach(t => {
        if (!t.completada && t.recordatorioHora) {
          void scheduleTaskReminder(t.id, t.titulo, t.recordatorioHora);
        }
      });
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [user, setLoading, setTasks]);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user, loadTasks]);

  const createTask = useCallback(async (data: Pick<Task, 'titulo' | 'descripcion' | 'prioridad' | 'deadline' | 'subtareas' | 'recordatorioHora'>) => {
    if (!user) return;

    const task: Task = {
      id: generateId(),
      userId: user.id,
      titulo: data.titulo,
      descripcion: data.descripcion,
      completada: false,
      prioridad: data.prioridad,
      deadline: data.deadline,
      recordatorioHora: data.recordatorioHora,
      subtareas: data.subtareas,
      creadoEn: new Date().toISOString(),
    };

    await db.tasks.add(task);
    addTaskToStore(task);

    if (task.recordatorioHora) {
      void scheduleTaskReminder(task.id, task.titulo, task.recordatorioHora);
    }
  }, [user, addTaskToStore]);

  const editTask = useCallback(async (id: string, updates: Partial<Task>) => {
    await db.tasks.update(id, updates);
    updateTaskInStore(id, updates);

    const updatedTask = (await db.tasks.get(id)) as Task;
    if (updatedTask) {
      if (updatedTask.completada || !updatedTask.recordatorioHora) {
        void cancelReminders(id);
      } else {
        void scheduleTaskReminder(updatedTask.id, updatedTask.titulo, updatedTask.recordatorioHora);
      }
    }
  }, [updateTaskInStore]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      await db.tasks.delete(id);
      removeTaskFromStore(id);
      void cancelReminders(id);
    } catch (err) {
      console.error('Local delete task error:', err);
    }
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
