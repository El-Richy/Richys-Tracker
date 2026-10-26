import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTasks } from '../hooks/useTasks';
import { TaskCard } from '../components/TaskCard';
import { TaskForm, type TaskFormData } from '../components/TaskForm';
import type { Task } from '../types';
import { useOverlayHistory } from '../lib/overlayHistory';

export function TasksPage() {
  const {
    tasks,
    isLoading,
    createTask,
    editTask,
    deleteTask,
    toggleTask,
    toggleSubtask,
    addSubtask,
    loadTasks,
  } = useTasks();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useOverlayHistory(showForm || editingTask !== null, () => {
    setShowForm(false);
    setEditingTask(null);
  });

  const pendingTasks = tasks.filter(t => !t.completada);
  const completedTasks = tasks.filter(t => t.completada);

  function handleCreate(data: TaskFormData) {
    createTask(data);
    setShowForm(false);
  }

  function handleEdit(data: TaskFormData) {
    if (!editingTask) return;
    editTask(editingTask.id, data);
    setEditingTask(null);
  }

  function confirmDelete() {
    if (deletingTaskId) {
      deleteTask(deletingTaskId);
      setDeletingTaskId(null);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Tareas</h1>
        <p className="text-sm text-text-secondary mt-1">
          {pendingTasks.length === 0 
            ? '¡Todo al día! 🎉' 
            : `Tienes ${pendingTasks.length} tarea${pendingTasks.length !== 1 ? 's' : ''} pendiente${pendingTasks.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading && tasks.length === 0 && (
        <div className="text-center py-12 text-text-secondary">Cargando tareas...</div>
      )}

      {/* Empty State */}
      {!isLoading && tasks.length === 0 && (
        <motion.div className="text-center py-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-5xl mb-4">✅</div>
          <p className="text-text-secondary mb-1">No tienes tareas pendientes 🎉</p>
          <p className="text-text-secondary/60 text-sm">Toca el botón + para crear una</p>
        </motion.div>
      )}

      {/* Listas */}
      <div className="space-y-6">
        {/* Pendientes */}
        {pendingTasks.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence>
              {pendingTasks.map((task, i) => (
                <TaskCard
                  key={task.id}
                  index={i}
                  task={task}
                  onToggleCheck={() => toggleTask(task.id)}
                  onToggleSubtask={(sid) => toggleSubtask(task.id, sid)}
                  onAddSubtask={(name) => addSubtask(task.id, name)}
                  onEdit={() => setEditingTask(task)}
                  onDelete={() => setDeletingTaskId(task.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Completadas */}
        {completedTasks.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-sm font-bold text-text-secondary hover:text-text-primary mb-3 transition-colors"
            >
              <span className={`transform transition-transform ${showCompleted ? 'rotate-90' : ''}`}>▶</span>
              Completadas ({completedTasks.length})
            </button>
            
            <AnimatePresence>
              {showCompleted && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {completedTasks.map((task, i) => (
                    <TaskCard
                      key={task.id}
                      index={i}
                      task={task}
                      onToggleCheck={() => toggleTask(task.id)}
                      onToggleSubtask={(sid) => toggleSubtask(task.id, sid)}
                      onAddSubtask={(name) => addSubtask(task.id, name)}
                      onEdit={() => setEditingTask(task)}
                      onDelete={() => setDeletingTaskId(task.id)}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-accent text-white text-2xl shadow-lg shadow-accent/30 flex items-center justify-center z-20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
      >
        +
      </motion.button>

      {/* Modales */}
      {showForm && (
        <TaskForm task={null} onSubmit={handleCreate} onClose={() => setShowForm(false)} />
      )}
      {editingTask && (
        <TaskForm task={editingTask} onSubmit={handleEdit} onClose={() => setEditingTask(null)} />
      )}
      
      {/* Confirm Delete */}
      <AnimatePresence>
        {deletingTaskId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-bg-elevated p-6 rounded-xl border border-border w-full max-w-sm"
            >
              <h3 className="text-xl font-bold text-text-primary mb-2">¿Eliminar tarea?</h3>
              <p className="text-sm text-text-secondary mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeletingTaskId(null)} className="px-4 py-2 text-text-secondary">Cancelar</button>
                <button onClick={confirmDelete} className="px-4 py-2 bg-danger text-white rounded-lg">Eliminar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
