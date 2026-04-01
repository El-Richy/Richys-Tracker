import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useUiStore } from '../store';
import { useHabits } from '../hooks/useHabits';
import { useTasks } from '../hooks/useTasks';
import { useJournal } from '../hooks/useJournal';
import { JournalForm } from '../components/JournalForm';
import { JournalDetailModal } from '../components/JournalDetailModal';
import { type TabId } from '../components/TabBar';
import { supabase } from '../lib/supabase';
import type { Habit } from '../types';
import { useRewards } from '../hooks/useRewards';
import { QuickNoteModal } from '../components/QuickNoteModal';

interface HomePageProps {
  onNavigate: (tab: TabId) => void;
  onNavigateToRewards: () => void;
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

// MOODS removidos de esta sección (se manejan en JournalForm)

export function HomePage({ onNavigate, onNavigateToRewards }: HomePageProps) {
  const user = useAuthStore((s) => s.user);
  const { habits, totalPoints, toggleCheck, getLogForHabit } = useHabits();
  const { tasks, toggleTask } = useTasks();
  const { createEntry, getRecuerdoDeHoy } = useJournal();
  const { rewards, estaDisponible } = useRewards();

  const [greeting, setGreeting] = useState('');
  const [motivator, setMotivator] = useState('');
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [showQuickNoteForm, setShowQuickNoteForm] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [autoOpenCamera, setAutoOpenCamera] = useState(false);

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Buenos días');
    else if (hour >= 12 && hour < 19) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');

    setMotivator(MOTIVADORES[Math.floor(Math.random() * MOTIVADORES.length)]);

    const stored = localStorage.getItem('displayName');
    const meta = user?.user_metadata?.display_name;
    const finalName = stored || meta || null;

    if (finalName) {
      setDisplayName(finalName);
    } else {
      setShowNameModal(true);
    }
  }, [user]);

  const showToast = useUiStore((s) => s.showToast);

  const handleSaveName = async () => {
    if (!tempName.trim()) return;
    const name = tempName.trim();
    
    try {
      localStorage.setItem('displayName', name);
      setDisplayName(name);
      setShowNameModal(false);

      const { error } = await supabase.auth.updateUser({
        data: { display_name: name }
      });

      if (error) throw error;
      showToast('¡Nombre guardado!', 'success');
    } catch (error) {
      console.error('Error saving name:', error);
      showToast('Error al guardar el nombre', 'error');
    }
  };

  const nombreUsuario = displayName || 'tú';
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
    const priorityOrder = { alta: 0, media: 1, baja: 2 };
    
    // Primaria: Hábitos activos hoy
    let baseHabits = [...activeHabitsToday];
    
    // Si hay menos de 3, rellenar con otros hábitos para cumplir el mínimo de 3
    if (baseHabits.length < 3) {
      const otherHabits = habits.filter(h => !h.diasActivos.includes(todayDay));
      const needed = 3 - baseHabits.length;
      baseHabits = [...baseHabits, ...otherHabits.slice(0, needed)];
    }

    const sorted = baseHabits.sort((a, b) => 
      priorityOrder[a.prioridad || 'media'] - priorityOrder[b.prioridad || 'media']
    );
    
    if (sorted.length <= 4) return sorted;
    return sorted.slice(0, 4);
  }, [activeHabitsToday, habits, todayDay]);

  const visibleTasks = useMemo(() => {
    const priorityOrder = { alta: 0, media: 1, baja: 2 };
    const sorted = tasks
      .filter(t => !t.completada)
      .sort((a, b) => priorityOrder[a.prioridad || 'media'] - priorityOrder[b.prioridad || 'media']);
    
    // Mostrar entre 2 y 4.
    if (sorted.length <= 4) return sorted;
    return sorted.slice(0, 4);
  }, [tasks]);

  const recompensasDisponibles = useMemo(() => 
    rewards.filter(r => estaDisponible(r)).slice(0, 2)
  , [rewards, estaDisponible]);

  
  // ultimoRegistro removido

  // Handlers removidos: ya no hay selección de humor rápida en Home

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
            onClick={(e) => { e.stopPropagation(); setShowQuickNoteForm(true); }}
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
            onClick={(e) => { e.stopPropagation(); setAutoOpenCamera(false); setShowJournalForm(true); }}
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
            onClick={(e) => { e.stopPropagation(); setAutoOpenCamera(true); setShowJournalForm(true); }}
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

      {/* SECCIÓN 6 — Mis Recompensas (Mejora 2) */}
      <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
              🎁 Mis Recompensas
            </h3>
            <span className="text-text-secondary text-xs mt-0.5">
              ⭐ {totalPoints} puntos disponibles
            </span>
          </div>
          <button 
            onClick={onNavigateToRewards}
            className="text-accent text-xs font-bold hover:underline"
          >
            Ver catálogo →
          </button>
        </div>
        
        {recompensasDisponibles.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {recompensasDisponibles.map(reward => (
              <div 
                key={reward.id} 
                className="bg-bg-card border border-border p-4 rounded-xl flex flex-col items-center gap-2 text-center cursor-pointer hover:bg-bg-elevated transition-colors shadow-sm"
                onClick={onNavigateToRewards}
              >
                <span className="text-2xl">{reward.icono}</span>
                <span className="text-[10px] font-bold text-text-primary line-clamp-1 uppercase">{reward.nombre}</span>
                <span className="text-[10px] font-extrabold text-accent">{reward.precioPuntos} puntos</span>
              </div>
            ))}
          </div>
        ) : (
          <div 
            className="bg-bg-card border border-border border-dashed p-6 rounded-xl text-center cursor-pointer"
            onClick={onNavigateToRewards}
          >
            <p className="text-xs text-text-secondary italic">Define tus premios en Ajustes para motivarte</p>
          </div>
        )}
      </motion.div>

      {/* Modales */}
      {showJournalForm && (
        <JournalForm
          autoOpenCamera={autoOpenCamera}
          onSubmit={(data) => {
            createEntry(data);
            setShowJournalForm(false);
            setAutoOpenCamera(false);
          }}
          onClose={() => {
            setShowJournalForm(false);
            setAutoOpenCamera(false);
          }}
        />
      )}

      {showQuickNoteForm && (
        <QuickNoteModal
          onSubmit={(data) => {
            createEntry({ ...data, fotos: [] });
            setShowQuickNoteForm(false);
          }}
          onClose={() => setShowQuickNoteForm(false)}
        />
      )}

      {selectedEntry && (
        <JournalDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      {/* Modal Personalización Nombre (Bug 2) */}
      <AnimatePresence>
        {showNameModal && (
          <motion.div
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-bg-card border border-border rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
            >
              <div className="text-4xl">👋</div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-text-primary">¿Cómo quieres que te llamemos?</h3>
                <p className="text-sm text-text-secondary italic">Queremos saludarte por tu nombre.</p>
              </div>
              
              <input 
                type="text" 
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Tu nombre o apodo"
                className="w-full bg-bg-primary border border-border p-4 rounded-xl text-center text-lg font-bold text-text-primary focus:border-accent outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />

              <button
                onClick={handleSaveName}
                disabled={!tempName.trim()}
                className="w-full py-4 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all disabled:opacity-50"
              >
                Listo, empecemos 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
