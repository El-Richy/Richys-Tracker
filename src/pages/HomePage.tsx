import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useHabitStore } from '../store';
import { useTasks } from '../hooks/useTasks';
import { useJournal } from '../hooks/useJournal';
import { getLocalDateStr } from '../utils/dateUtils';
import { JournalForm } from '../components/JournalForm';
import { JournalDetailModal } from '../components/JournalDetailModal';
import { type TabId } from '../components/TabBar';
import { supabase } from '../lib/supabase';
import { useUiStore } from '../store';

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

const MOODS: { val: 1 | 2 | 3 | 4 | 5, emoji: string }[] = [
  { val: 1, emoji: '😞' },
  { val: 2, emoji: '😕' },
  { val: 3, emoji: '😐' },
  { val: 4, emoji: '🙂' },
  { val: 5, emoji: '😄' },
];

import { useRewards } from '../hooks/useRewards';

export function HomePage({ onNavigate, onNavigateToRewards }: HomePageProps) {
  const user = useAuthStore((s) => s.user);
  const { habits, logs, totalPoints } = useHabitStore();
  const { tasks, toggleTask } = useTasks();
  const { entries, getRecuerdoDeHoy, createEntry } = useJournal();
  const { rewards, estaDisponible } = useRewards();

  const [greeting, setGreeting] = useState('');
  const [motivator, setMotivator] = useState('');
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [quickMood, setQuickMood] = useState<1 | 2 | 3 | 4 | 5 | undefined>();
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [autoOpenCamera, setAutoOpenCamera] = useState(false);

  // Bug 2 — Name state
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState('');

  const hoyStr = getLocalDateStr();

  // 1. Initial Logic (Greeting + Name Check)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Buenos días');
    else if (hour >= 12 && hour < 19) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');

    setMotivator(MOTIVADORES[Math.floor(Math.random() * MOTIVADORES.length)]);

    // Bug 2 — Name fetch
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
      // Save locally
      localStorage.setItem('displayName', name);
      setDisplayName(name);
      setShowNameModal(false);

      // Save to Supabase metadata
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

  // 2. Recuerdo Logic
  const recuerdo = useMemo(() => getRecuerdoDeHoje(), [getRecuerdoDeHoy]);

  // FIXME: Typescript error fix for the above memo
  function getRecuerdoDeHoje() {
    return getRecuerdoDeHoy();
  }

  // 3. Progreso Logic
  const habitosHoy = useMemo(() => 
    logs.filter(l => l.fecha === hoyStr && l.completado).length
  , [logs, hoyStr]);

  const totalHabitos = habits.length;
  
  const progresoPercent = useMemo(() => 
    totalHabitos > 0 ? (habitosHoy / totalHabitos) * 100 : 0
  , [habitosHoy, totalHabitos]);

  // 4. Tareas Logic
  const tareasAlta = useMemo(() => 
    tasks.filter(t => t.prioridad === 'alta' && !t.completada)
  , [tasks]);

  // 5. Recompensas Logic (Mejora 2)
  const recompensasDisponibles = useMemo(() => 
    rewards.filter(r => estaDisponible(r)).slice(0, 2)
  , [rewards, estaDisponible]);

  // 5. Journal Registro Logic
  const entradasHoy = useMemo(() => 
    entries.filter(e => getLocalDateStr(new Date(e.creadoEn)) === hoyStr)
  , [entries, hoyStr]);

  const hayRegistroHoy = entradasHoy.length > 0;
  
  const ultimoRegistro = useMemo(() => 
    entries.find(e => getLocalDateStr(new Date(e.creadoEn)) === hoyStr)
  , [entries, hoyStr]);

  const handleQuickMood = (val: 1 | 2 | 3 | 4 | 5) => {
    setQuickMood(val);
    setAutoOpenCamera(false);
    setShowJournalForm(true);
  };

  const handleQuickPhoto = () => {
    setQuickMood(undefined);
    setAutoOpenCamera(true);
    setShowJournalForm(true);
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-12 space-y-8 overflow-x-hidden">
      
      {/* SECCIÓN 1 — Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-text-secondary font-medium">{greeting}, {nombreUsuario}</p>
        <h1 className="text-3xl font-bold text-text-primary mt-1">{fechaHoyStr}</h1>
        <p className="text-accent text-sm font-medium mt-2 animate-pulse">{motivator}</p>
      </motion.div>

      {/* SECCIÓN 2 — Recuerdo (Condicional) */}
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
            <span className="text-4xl shrink-0">{MOODS.find(m => m.val === recuerdo.estadoAnimo)?.emoji}</span>
            <div className="space-y-1">
              {recuerdo.titulo && (
                <h4 className="text-text-primary font-bold line-clamp-1">{recuerdo.titulo}</h4>
              )}
              <p className="text-text-secondary text-sm line-clamp-2 italic">"{recuerdo.texto}"</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* SECCIÓN 3 — Progreso del día */}
      <motion.div 
        className="bg-bg-card rounded-2xl border border-border p-5 space-y-4 cursor-pointer hover:bg-bg-elevated/20 transition-all active:scale-[0.99]" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.1 }}
        onClick={() => onNavigate('habits')}
      >
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Hábitos</h3>
            <p className="text-xs text-text-secondary">{new Date().getDate()} de {new Date().toLocaleDateString('es-ES', { month: 'short' })}</p>
          </div>
          <span className="text-accent font-bold text-xl">{habitosHoy} / {totalHabitos}</span>
        </div>
        
        <div className="h-4 bg-bg-elevated rounded-full overflow-hidden border border-border/50">
          <motion.div
            className="h-full bg-accent shadow-[0_0_15px_rgba(240,97,26,0.3)]"
            initial={{ width: 0 }}
            animate={{ width: `${progresoPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-text-secondary text-center">
          {progresoPercent === 100 ? '¡Hábitos completados! 🎉' : `${totalHabitos - habitosHoy} hábitos restantes para hoy`}
        </p>
      </motion.div>

      {/* SECCIÓN 4 — Tareas prioritarias */}
      <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
            <span className="text-accent animate-bounce">⚡</span> Prioridad alta
          </h3>
          {tareasAlta.length > 3 && (
            <button 
              onClick={() => onNavigate('tasks')}
              className="text-accent text-xs font-bold hover:underline"
            >
              Ver todas →
            </button>
          )}
        </div>
        <div className="space-y-2">
          {tareasAlta.length === 0 ? (
            <div className="text-center text-text-secondary py-3 text-sm">
              Sin urgencias hoy 🎉
            </div>
          ) : (
            tareasAlta.slice(0, 3).map(task => (
              <div key={task.id} className="bg-bg-card border border-border p-4 rounded-xl flex items-center gap-3">
                {/* Zona del checkbox — stopPropagation para no navegar */}
                <div 
                  onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                  className="w-5 h-5 rounded border-2 border-accent flex items-center justify-center cursor-pointer flex-shrink-0"
                >
                  {task.completada && <span className="text-accent text-xs">✓</span>}
                </div>
                
                {/* Zona de navegación */}
                <span 
                  onClick={() => onNavigate('tasks')} 
                  className="flex-1 cursor-pointer text-sm font-medium text-text-primary"
                >
                  {task.titulo}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* SECCIÓN 5 — Entrada rápida al journal */}
      <motion.div 
        className="bg-bg-card rounded-2xl border border-border p-6 text-center space-y-6 cursor-pointer hover:bg-bg-elevated/20 transition-all active:scale-[0.99]" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.3 }}
        onClick={() => !hayRegistroHoy && onNavigate('journal')}
      >
        <h3 className="text-lg font-bold text-text-primary">📓 ¿Cómo te sientes hoy?</h3>
        
        {hayRegistroHoy ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">{MOODS.find(m => m.val === ultimoRegistro?.estadoAnimo)?.emoji}</span>
              <p className="text-success text-sm font-bold flex items-center gap-1">Registrado hoy <span className="text-lg">✓</span></p>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => { setQuickMood(undefined); setAutoOpenCamera(false); setShowJournalForm(true); }}
                className="text-accent text-sm font-bold py-2.5 px-6 rounded-2xl bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all flex items-center gap-2"
              >
                <span>+ Nota</span>
              </button>
              <button
                onClick={handleQuickPhoto}
                className="text-white text-sm font-bold py-2.5 px-6 rounded-2xl bg-bg-elevated border border-border hover:bg-bg-primary transition-all flex items-center gap-2"
              >
                <span>📷 Foto</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center max-w-[280px] mx-auto">
              {MOODS.map(m => (
                <button
                  key={m.val}
                  onClick={() => handleQuickMood(m.val)}
                  className="text-4xl hover:scale-125 transition-transform active:scale-95"
                >
                  {m.emoji}
                </button>
              ))}
            </div>
            <button
              onClick={handleQuickPhoto}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-border text-text-secondary hover:border-accent hover:text-accent hover:bg-accent/5 transition-all font-bold flex items-center justify-center gap-2"
            >
              <span>📷 Foto rápida del momento</span>
            </button>
          </div>
        )}
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
          initialData={quickMood ? { estadoAnimo: quickMood } : undefined}
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
