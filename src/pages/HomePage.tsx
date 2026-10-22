import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, useUiStore } from '../store';
import { useHabits } from '../hooks/useHabits';
import { useTasks } from '../hooks/useTasks';
import { useJournal } from '../hooks/useJournal';
import { JournalDetailModal } from '../components/JournalDetailModal';
import { type TabId } from '../components/TabBar';
import type { Habit, JournalEntry } from '../types';

interface HomePageProps {
  onNavigate: (tab: TabId) => void;
}

const MOTIVADORES = [
  "Un día a la vez 🌱",
  "Hoy es una nueva oportunidad ✨",
  "Pequeños pasos, grandes cambios 🚀",
  "Tu mejor versión te espera 💪",
  "Consistencia > Perfección 🎯"
];

const MOOD_EMOJIS: Record<number, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
};

export function HomePage({ onNavigate }: HomePageProps) {
  const user = useAuthStore((s) => s.user);
  const { habits, toggleCheck, getLogForHabit } = useHabits();
  const { tasks, toggleTask } = useTasks();
  const { getRecuerdoDeHoy } = useJournal();

  const [greeting, setGreeting] = useState('');
  const [motivator, setMotivator] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const openQuickAction = useUiStore((s) => s.openQuickAction);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Buenos días');
    else if (hour >= 12 && hour < 19) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');

    setMotivator(MOTIVADORES[Math.floor(Math.random() * MOTIVADORES.length)]);
  }, []);

  const nombreUsuario = user?.displayName || 'tú';
  const fechaHoyStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).replace(/^\w/, (c) => c.toUpperCase());

  const recuerdo = useMemo(() => getRecuerdoDeHoy(), [getRecuerdoDeHoy]);

  const todayDay = new Date().getDay();
  const activeHabitsToday = useMemo(() =>
    habits.filter(h => h.diasActivos.includes(todayDay))
  , [habits, todayDay]);

  const habitosHoyCount = useMemo(() =>
    activeHabitsToday.filter(h => getLogForHabit(h.id)?.completado).length
  , [activeHabitsToday, getLogForHabit]);

  const totalHabitosToday = activeHabitsToday.length;

  const progresoPercent = useMemo(() =>
    totalHabitosToday > 0 ? (habitosHoyCount / totalHabitosToday) * 100 : 0
  , [habitosHoyCount, totalHabitosToday]);

  const visibleHabits = useMemo(() => {
    const priorityOrder: Record<string, number> = { alta: 0, media: 1, baja: 2 };

    const dailyActive = [...activeHabitsToday].sort((a, b) => {
      const pDiff = (priorityOrder[a.prioridad || 'media'] ?? 1) - (priorityOrder[b.prioridad || 'media'] ?? 1);
      if (pDiff !== 0) return pDiff;
      const nDiff = (a.nombre || '').localeCompare(b.nombre || '');
      if (nDiff !== 0) return nDiff;
      return (a.id || '').localeCompare(b.id || '');
    });

    const others = habits
      .filter(h => !h.diasActivos.includes(todayDay))
      .sort((a, b) => {
        const pDiff = (priorityOrder[a.prioridad || 'media'] ?? 1) - (priorityOrder[b.prioridad || 'media'] ?? 1);
        if (pDiff !== 0) return pDiff;
        const nDiff = (a.nombre || '').localeCompare(b.nombre || '');
        if (nDiff !== 0) return nDiff;
        return (a.id || '').localeCompare(b.id || '');
      });

    return [...dailyActive, ...others].slice(0, 4);
  }, [activeHabitsToday, habits, todayDay]);

  const visibleTasks = useMemo(() => {
    const priorityOrder: Record<string, number> = { alta: 0, media: 1, baja: 2 };
    return tasks
      .filter(t => !t.completada)
      .sort((a, b) => (priorityOrder[a.prioridad || 'media'] ?? 1) - (priorityOrder[b.prioridad || 'media'] ?? 1))
      .slice(0, 4);
  }, [tasks]);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-12 space-y-8 overflow-x-hidden">

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-text-secondary font-medium">{greeting}, {nombreUsuario}</p>
        <h1 className="text-3xl font-bold text-text-primary mt-1">{fechaHoyStr}</h1>
        <p className="text-accent text-sm font-medium mt-2 animate-pulse">{motivator}</p>
      </motion.div>

      {recuerdo && (
        <motion.div
          className="bg-bg-card rounded-2xl border-l-4 border-l-accent border border-border p-5 shadow-lg cursor-pointer hover:bg-bg-elevated/50 transition-colors"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setSelectedEntry(recuerdo)}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-text-secondary flex items-center gap-1">
              📅 Un día como hoy...
            </span>
            <span className="text-[10px] bg-bg-elevated px-2 py-0.5 rounded-full text-text-secondary border border-border">
              {new Date(recuerdo.creadoEn).getFullYear()}
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-4xl shrink-0">
              {recuerdo.estadoAnimo ? MOOD_EMOJIS[recuerdo.estadoAnimo] : '📝'}
            </span>
            <div className="space-y-1">
              {recuerdo.titulo && (
                <h4 className="text-text-primary font-bold line-clamp-1">{recuerdo.titulo}</h4>
              )}
              <p className="text-text-secondary text-sm line-clamp-2 italic">"{recuerdo.texto}"</p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        className="bg-bg-card rounded-2xl border border-border p-5 space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex justify-between items-end cursor-pointer" onClick={() => onNavigate('habits')}>
          <div>
            <h3 className="text-lg font-bold text-text-primary">Hábitos de hoy</h3>
            <p className="text-xs text-text-secondary">{new Date().getDate()} de {new Date().toLocaleDateString('es-ES', { month: 'short' })}</p>
          </div>
          <span className="text-accent font-bold text-xl">{habitosHoyCount} / {totalHabitosToday}</span>
        </div>

        <div className="space-y-4">
          <div className="h-2.5 bg-bg-elevated rounded-full overflow-hidden border border-border/50">
            <motion.div
              className="h-full bg-accent shadow-[0_0_15px_rgba(240,97,26,0.3)]"
              initial={{ width: 0 }}
              animate={{ width: `${progresoPercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          <div className="grid grid-cols-1 gap-2 pt-2">
            {visibleHabits.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-2 italic">No hay hábitos programados para hoy</p>
            ) : (
              visibleHabits.map((habit: Habit) => {
                const log = getLogForHabit(habit.id);
                const isChecked = log?.completado || false;
                return (
                  <div
                    key={habit.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isChecked ? 'bg-accent/5 border-accent/20' : 'bg-bg-primary/40 border-border/50'
                    }`}
                  >
                    <div className="flex flex-col items-center min-w-[24px]">
                      <span className="text-xl">{habit.icono}</span>
                      {habit.prioridad === 'alta' && !isChecked && (
                        <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse -mt-1" title="Alta prioridad" />
                      )}
                    </div>
                    <span className={`text-sm font-medium flex-1 ${isChecked ? 'text-text-primary/60 line-through' : 'text-text-primary'}`}>
                      {habit.nombre}
                    </span>
                    <button
                      onClick={() => toggleCheck(habit.id)}
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-accent border-accent text-white'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      {isChecked && <span className="text-xs">✓</span>}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <p className="text-[10px] text-text-secondary text-center uppercase tracking-widest font-bold">
          {progresoPercent === 100 ? '¡Día perfecto! 🎉' : `${totalHabitosToday - habitosHoyCount} restantes`}
        </p>
      </motion.div>

      <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
            <span className="text-accent">🚀</span> Mis Tareas
          </h3>
          <button
            onClick={() => onNavigate('tasks')}
            className="text-accent text-xs font-bold hover:underline"
          >
            Ver todas →
          </button>
        </div>
        <div className="space-y-2">
          {visibleTasks.length === 0 ? (
            <div className="text-center text-text-secondary py-3 text-sm">
              Sin tareas pendientes 🎉
            </div>
          ) : (
            visibleTasks.map(task => (
              <div key={task.id} className="bg-bg-card border border-border p-4 rounded-xl flex items-center gap-3 active:scale-[0.98] transition-transform">
                <div
                  onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer flex-shrink-0 transition-all ${
                    task.prioridad === 'alta' ? 'border-danger/50 bg-danger/5' : 'border-accent/50'
                  }`}
                >
                  {task.completada && <span className="text-accent text-xs">✓</span>}
                </div>

                <div className="flex-1 min-w-0" onClick={() => onNavigate('tasks')}>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {task.titulo}
                  </p>
                  {task.prioridad === 'alta' && (
                    <span className="text-[10px] text-danger font-bold uppercase tracking-wider">Alta Prioridad</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      <motion.div
        className="bg-bg-card rounded-2xl border border-border p-6 text-center space-y-6 cursor-pointer hover:bg-bg-elevated/20 transition-all active:scale-[0.99]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => onNavigate('journal')}
      >
        <h3 className="text-lg font-bold text-text-primary">📓 Ideas y Recuerdos</h3>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); openQuickAction('note'); }}
            className="group py-5 rounded-3xl border border-border bg-gradient-to-br from-bg-primary/50 to-bg-elevated/10 text-white hover:border-accent hover:from-accent/10 hover:to-accent/5 transition-all font-bold flex items-center justify-between px-6 shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl group-hover:rotate-12 transition-transform">📝</span>
              <div className="text-left">
                <span className="block text-sm">Nota rápida</span>
                <span className="block text-[10px] text-text-secondary uppercase tracking-widest font-medium">Solo texto, al instante</span>
              </div>
            </div>
            <span className="text-accent">→</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); openQuickAction('journal'); }}
            className="group py-5 rounded-3xl border border-border bg-gradient-to-br from-bg-primary/50 to-bg-elevated/10 text-white hover:border-accent hover:from-accent/10 hover:to-accent/5 transition-all font-bold flex items-center justify-between px-6 shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl group-hover:rotate-12 transition-transform">📓</span>
              <div className="text-left">
                <span className="block text-sm">Entrada de Diario</span>
                <span className="block text-[10px] text-text-secondary uppercase tracking-widest font-medium">Con emoción y detalles</span>
              </div>
            </div>
            <span className="text-accent">→</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); openQuickAction('photo'); }}
            className="group py-5 rounded-3xl border border-border bg-gradient-to-br from-bg-primary/50 to-bg-elevated/10 text-white hover:border-accent hover:from-accent/10 hover:to-accent/5 transition-all font-bold flex items-center justify-between px-6 shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl group-hover:rotate-12 transition-transform">📷</span>
              <div className="text-left">
                <span className="block text-sm">Foto rápida</span>
                <span className="block text-[10px] text-text-secondary uppercase tracking-widest font-medium">Guarda una imagen</span>
              </div>
            </div>
            <span className="text-accent">→</span>
          </button>
        </div>
      </motion.div>

      {selectedEntry && (
        <JournalDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </div>
  );
}
