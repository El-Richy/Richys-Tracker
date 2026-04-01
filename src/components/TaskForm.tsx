import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task, Subtarea } from '../types';
import { generateId } from '../utils/idUtils';

interface TaskFormProps {
  task: Task | null;
  onSubmit: (data: TaskFormData) => void;
  onClose: () => void;
}

export interface TaskFormData {
  titulo: string;
  descripcion: string;
  prioridad: 'alta' | 'media' | 'baja';
  deadline: string;
  subtareas: Subtarea[];
}

export function TaskForm({ task, onSubmit, onClose }: TaskFormProps) {
  const [titulo, setTitulo] = useState(task?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(task?.descripcion ?? '');
  const [prioridad, setPrioridad] = useState<'alta' | 'media' | 'baja'>(
    task?.prioridad ?? 'media'
  );
  const [deadline, setDeadline] = useState(task?.deadline ?? '');
  const [subtareas, setSubtareas] = useState<Subtarea[]>(
    task?.subtareas ?? []
  );
  
  const [newSubtask, setNewSubtask] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isEdit = task !== null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      setError('El título es obligatorio');
      return;
    }
    onSubmit({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      prioridad,
      deadline: deadline || '',
      subtareas,
    });
  }

  function addSubtask() {
    if (!newSubtask.trim()) return;
    setSubtareas((prev) => [
      ...prev,
      { id: generateId(), nombre: newSubtask.trim(), completada: false } as any,
    ]);
    setNewSubtask('');
  }

  function removeSubtask(id: string) {
    setSubtareas((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-bg-card w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-y-auto border border-border"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">
                {isEdit ? 'Editar Tarea' : 'Crear Tarea'}
              </h2>
              <button type="button" onClick={onClose} className="text-text-secondary text-xl">✕</button>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Título</label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Comprar víveres"
                className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border text-text-primary focus:border-accent outline-none transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Descripción (opcional)</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalles de la tarea..."
                className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border text-text-primary focus:border-accent outline-none transition-colors min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Prioridad</label>
                <select
                  value={prioridad}
                  onChange={(e) => setPrioridad(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border text-text-primary focus:border-accent outline-none"
                >
                  <option value="alta">Alta 🔴</option>
                  <option value="media">Media 🟡</option>
                  <option value="baja">Baja ⚪</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Fecha límite</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border text-text-primary focus:border-accent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Subtareas</label>
              <div className="space-y-2 mb-3">
                {subtareas.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2 group">
                    <span className="flex-1 text-sm text-text-primary px-3 py-2 rounded-lg bg-bg-elevated border border-border/50">
                      {sub.nombre}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(sub.id)}
                      className="text-danger p-2 hover:bg-danger/10 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                  placeholder="Añadir paso..."
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm focus:border-accent outline-none"
                />
                <button
                  type="button"
                  onClick={addSubtask}
                  className="px-4 py-2 rounded-lg bg-bg-elevated text-accent font-bold hover:bg-accent/10 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {error && <p className="text-danger text-sm bg-danger/10 p-3 rounded-lg text-center">{error}</p>}

            <button
              type="submit"
              className="w-full py-4 rounded-lg bg-accent text-white font-bold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20"
            >
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
