import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useHabits } from '../hooks/useHabits';
import { HabitCard } from '../components/HabitCard';
import { HabitForm, type HabitFormData } from '../components/HabitForm';
import type { Habit } from '../types';

/**
 * Pantalla principal — lista de hábitos con FAB para crear.
 */
export function HabitsPage() {
  const {
    isLoading,
    createHabit,
    editHabit,
    deleteHabit,
    toggleCheck,
    toggleSubtask,
    addSubtask,
    getLogForHabit,
    sortedHabits,
  } = useHabits();

  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);

  function handleCreate(data: HabitFormData) {
    createHabit(data);
    setShowForm(false);
  }

  function handleEdit(data: HabitFormData) {
    if (!editingHabit) return;
    editHabit(editingHabit.id, data);
    setEditingHabit(null);
  }

  function handleDelete(id: string) {
    setDeletingHabitId(id);
  }

  function confirmDelete() {
    if (deletingHabitId) {
      deleteHabit(deletingHabitId);
      setDeletingHabitId(null);
    }
  }

  function openEdit(habit: Habit) {
    setEditingHabit(habit);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          Mis hábitos
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {sortedHabits.length === 0
            ? 'Crea tu primer hábito para empezar'
            : `${sortedHabits.length} hábito${sortedHabits.length !== 1 ? 's' : ''} activo${sortedHabits.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Loading */}
      {isLoading && sortedHabits.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          Cargando hábitos...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sortedHabits.length === 0 && (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-text-secondary mb-1">No tienes hábitos todavía</p>
          <p className="text-text-secondary/60 text-sm">
            Toca el botón + para crear uno
          </p>
        </motion.div>
      )}

      {/* Habit list */}
      <div className="space-y-3">
        <AnimatePresence>
          {sortedHabits.map((habit, i) => (
            <HabitCard
              key={habit.id}
              index={i}
              habit={habit}
              log={getLogForHabit(habit.id)}
              onToggleCheck={() => toggleCheck(habit.id)}
              onToggleSubtask={(subtaskId) => toggleSubtask(habit.id, subtaskId)}
              onAddSubtask={(name) => addSubtask(habit.id, name)}
              onEdit={() => openEdit(habit)}
              onDelete={() => handleDelete(habit.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* FAB — botón flotante para crear */}
      <motion.button
        type="button"
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-accent text-white text-2xl shadow-lg shadow-accent/30 hover:bg-accent/90 active:scale-90 transition-all flex items-center justify-center z-20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
      >
        +
      </motion.button>

      {/* Modal crear */}
      {showForm && (
        <HabitForm
          habit={null}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Modal editar */}
      {editingHabit && (
        <HabitForm
          habit={editingHabit}
          onSubmit={handleEdit}
          onClose={() => setEditingHabit(null)}
        />
      )}
      {/* Modal confirmar eliminar */}
      {deletingHabitId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-bg-elevated p-6 rounded-xl shadow-xl w-full max-w-sm border border-border"
          >
            <h3 className="text-xl font-bold text-text-primary mb-2">Eliminar hábito</h3>
            <p className="text-text-secondary mb-6">
              ¿Estás seguro? Esta acción eliminará todo su historial, rachas y subtareas asociadas.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                onClick={() => setDeletingHabitId(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/90 transition-colors"
                onClick={confirmDelete}
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
