import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Habit, Subtarea } from '../types';
import { generateId } from '../utils/idUtils';

/** Colores predefinidos para elegir */
const PRESET_COLORS = [
  '#F0611A', '#E8C99A', '#22C55E', '#3B82F6',
  '#A855F7', '#EC4899', '#EF4444', '#F59E0B',
];

/** Iconos predefinidos */
const PRESET_ICONS = [
  '💪', '📚', '🏃', '💧', '🧘', '🎯', '✍️', '💤',
  '🥗', '🎨', '🎵', '💻', '🧹', '🌅', '📱', '⭐',
];

/** Días de la semana (abreviados) */
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

interface HabitFormProps {
  /** Hábito a editar. Si es null, es modo crear. */
  habit: Habit | null;
  onSubmit: (data: HabitFormData) => void;
  onClose: () => void;
}

export interface HabitFormData {
  nombre: string;
  color: string;
  icono: string;
  diasActivos: number[];
  diasGracia: number;
  recordatorioHora: string | null;
  subtareas: Subtarea[];
  prioridad: 'alta' | 'media' | 'baja';
}

export function HabitForm({ habit, onSubmit, onClose }: HabitFormProps) {
  const [nombre, setNombre] = useState(habit?.nombre ?? '');
  const [color, setColor] = useState(habit?.color ?? '#F0611A');
  const [icono, setIcono] = useState(habit?.icono ?? '💪');
  const [diasActivos, setDiasActivos] = useState<number[]>(
    habit?.diasActivos ?? [1, 2, 3, 4, 5]
  );
  const [diasGracia, setDiasGracia] = useState(habit?.diasGracia ?? 0);
  const [recordatorioHora, setRecordatorioHora] = useState(
    habit?.recordatorioHora ?? ''
  );
  const [subtareas, setSubtareas] = useState<Subtarea[]>(
    habit?.subtareas ?? []
  );
  const [prioridad, setPrioridad] = useState<'alta' | 'media' | 'baja'>(
    habit?.prioridad ?? 'media'
  );
  const [newSubtask, setNewSubtask] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isEdit = habit !== null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    onSubmit({
      nombre: nombre.trim(),
      color,
      icono,
      diasActivos,
      diasGracia,
      recordatorioHora: recordatorioHora || null,
      subtareas,
      prioridad,
    });
  }

  function toggleDay(day: number) {
    setDiasActivos((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function addSubtask() {
    if (!newSubtask.trim()) return;
    setSubtareas((prev) => [
      ...prev,
      { id: generateId(), nombre: newSubtask.trim() },
    ]);
    setNewSubtask('');
  }

  function removeSubtask(id: string) {
    setSubtareas((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        className="fixed inset-0 bg-black/60 z-40 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          className="bg-bg-card w-full sm:max-w-md sm:rounded-xl rounded-t-xl max-h-[85vh] overflow-y-auto border border-border"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Título */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">
                {isEdit ? 'Editar Hábito' : 'Crear Hábito'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary text-xl"
              >
                ✕
              </button>
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="habit-name" className="block text-sm text-text-secondary mb-1.5">
                Nombre
              </label>
              <input
                id="habit-name"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Meditar 10 min"
                className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border text-text-primary placeholder-text-secondary/50 focus:border-accent focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            {/* Icono */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Icono
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setIcono(icon)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
                      icono === icon
                        ? 'bg-accent/20 ring-2 ring-accent'
                        : 'bg-bg-elevated hover:bg-bg-elevated/80'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-bg-card scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Días activos */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5 font-medium">
                Días activos
              </label>
              <div className="flex gap-1.5">
                {DAYS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleDay(i)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                      diasActivos.includes(i)
                        ? 'bg-accent text-white shadow-sm shadow-accent/20'
                        : 'bg-bg-elevated text-text-secondary hover:bg-bg-elevated/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Prioridad */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5 font-medium">
                Prioridad
              </label>
              <div className="flex gap-2 p-1 bg-bg-primary rounded-xl border border-border">
                {[
                  { value: 'alta', label: 'Alta', color: 'text-danger bg-danger/10 border-danger/20' },
                  { value: 'media', label: 'Media', color: 'text-accent bg-accent/10 border-accent/20' },
                  { value: 'baja', label: 'Baja', color: 'text-success bg-success/10 border-success/20' }
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPrioridad(p.value as 'alta' | 'media' | 'baja')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all border ${
                      prioridad === p.value 
                        ? `${p.color} shadow-sm scale-[1.02]` 
                        : 'text-text-secondary border-transparent hover:bg-bg-elevated'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Días de gracia */}
            <div>
              <label htmlFor="grace-days" className="block text-sm text-text-secondary mb-1.5">
                Días de gracia (fallos sin romper racha)
              </label>
              <select
                id="grace-days"
                value={diasGracia}
                onChange={(e) => setDiasGracia(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border text-text-primary focus:border-accent focus:outline-none transition-colors"
              >
                <option value={0}>0 — Sin gracia</option>
                <option value={1}>1 día</option>
                <option value={2}>2 días</option>
                <option value={3}>3 días</option>
              </select>
            </div>

            {/* Recordatorio */}
            <div>
              <label htmlFor="reminder-time" className="block text-sm text-text-secondary mb-1.5">
                Recordatorio (opcional)
              </label>
              <input
                id="reminder-time"
                type="time"
                value={recordatorioHora}
                onChange={(e) => setRecordatorioHora(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-bg-primary border border-border text-text-primary focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            {/* Subtareas */}
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">
                Subtareas (opcional)
              </label>
              {subtareas.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 mb-1.5">
                  <span className="flex-1 text-sm text-text-primary px-3 py-2 rounded-lg bg-bg-elevated">
                    {sub.nombre}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSubtask(sub.id)}
                    className="text-danger text-xs hover:text-danger/80 px-2 py-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                  placeholder="Añadir subtarea..."
                  className="flex-1 px-3 py-2 rounded-lg bg-bg-primary border border-border text-text-primary text-sm placeholder-text-secondary/50 focus:border-accent focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={addSubtask}
                  className="px-3 py-2 rounded-lg bg-bg-elevated text-accent text-sm hover:bg-accent/10 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-danger text-sm text-center py-2 px-3 rounded-lg bg-danger/10">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 active:scale-[0.98] transition-all"
            >
              {isEdit ? 'Guardar' : 'Crear'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
