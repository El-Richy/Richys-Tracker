import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useHabitStore } from '../store';
import { db } from '../db';
import { MetricsPage } from './MetricsPage';
import { RewardsPage } from './RewardsPage';
import { supabase } from '../lib/supabase';

interface SettingsPageProps {
  activeSubPage: 'metrics' | 'rewards' | null;
  onNavigateSubPage: (sub: 'metrics' | 'rewards' | null) => void;
}

/**
 * Pantalla de ajustes con logout, accesos a métricas/recompensas y zona de peligro.
 */
export function SettingsPage({ activeSubPage, onNavigateSubPage }: SettingsPageProps) {
  const { user, logout } = useAuthStore();
  const { totalPoints, setTotalPoints } = useHabitStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [confirmReset, setConfirmReset] = useState<'none' | 'streaks' | 'points' | 'rewards'>('none');
  
  const [newName, setNewName] = useState(localStorage.getItem('displayName') || user?.user_metadata?.display_name || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Render subpages
  if (activeSubPage === 'metrics') {
    return <MetricsPage onBack={() => onNavigateSubPage(null)} />;
  }

  if (activeSubPage === 'rewards') {
    return <RewardsPage onBack={() => onNavigateSubPage(null)} />;
  }

  async function handleExport() {
    if (!user || isExporting) return;
    try {
      setIsExporting(true);
      const habitos = await db.habits.where('userId').equals(user.id).toArray();
      const habitIds = habitos.map(h => h.id);
      const logs = await db.habitLogs.where('habitId').anyOf(habitIds).toArray();
      const entries = await db.journalEntries.where('userId').equals(user.id).toArray();
      const tasks = await db.tasks.where('userId').equals(user.id).toArray();
      
      const data = {
        exportadoEn: new Date().toISOString(),
        version: "1.1.0",
        habitos,
        logs,
        journal: entries,
        tasks
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `richys-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error al exportar datos.');
    } finally {
      setIsExporting(false);
    }
  }

  const resetStreaks = async () => {
    if (!user) return;
    try {
      const streaks = await db.streaks.where('userId').equals(user.id).toArray();
      for (const s of streaks) {
        await db.streaks.update(s.habitId, { 
          rachaActual: 0, 
          rachaMaxima: 0, 
          estado: 'rota', 
          ultimoCheck: new Date().toISOString() 
        });
      }
      await supabase.from('habits').update({ 
        racha_actual: 0, 
        racha_maxima: 0 
      }).eq('user_id', user.id);
      
      setConfirmReset('none');
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const resetPoints = async () => {
    if (!user) return;
    try {
      await db.pointEntries.where('userId').equals(user.id).delete();
      await db.points.where('userId').equals(user.id).delete();
      setTotalPoints(0);
      await supabase.from('point_entries').delete().eq('user_id', user.id);
      await supabase.from('points').delete().eq('user_id', user.id);
      setConfirmReset('none');
    } catch (e) {
      console.error(e);
    }
  };

  const resetRewards = async () => {
    if (!user) return;
    try {
      // Dexie
      await db.rewards.where('userId').equals(user.id).modify({ 
        canjeada: false, 
        ultimoCanjeo: undefined 
      });

      // Supabase
      await supabase.from('rewards')
        .update({ canjeada: false, ultimo_canjeo: null })
        .eq('user_id', user.id);

      // Zustand (auto-sync usually handled by hooks, but we reload or manually update store if needed)
      // Since our hooks listen to Dexie changes or we can just reload for safety
      setConfirmReset('none');
      window.location.reload(); 
    } catch (e) {
      console.error(e);
    }
  };

  const saveDisplayName = async () => {
    if (!user || !newName.trim()) return;
    try {
      setIsSavingName(true);
      localStorage.setItem('displayName', newName.trim());
      const { error } = await supabase.auth.updateUser({
        data: { display_name: newName.trim() }
      });
      if (error) throw error;
      alert('Nombre actualizado correctamente');
    } catch (e) {
      console.error(e);
      alert('Error al guardar nombre');
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-text-primary">Ajustes</h1>
        <p className="text-sm text-text-secondary mt-1">Configuración y seguimiento personal</p>
      </div>

      {/* SECCIÓN — Estrellas/Progreso Rápido */}
      <div className="bg-gradient-to-br from-bg-card to-bg-elevated/40 rounded-3xl border border-border p-6 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-accent uppercase tracking-widest">Tus Puntos de Vida</p>
          <p className="text-4xl font-black text-text-primary tracking-tighter">⭐ {totalPoints}</p>
        </div>
        <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-2xl animate-pulse">
          🏆
        </div>
      </div>

      {/* ACCESOS DIRECTOS — Estadísticas y Premios */}
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => onNavigateSubPage('rewards')}
          className="w-full py-5 rounded-2xl bg-bg-card border border-border text-text-primary font-bold hover:bg-bg-elevated transition-all flex items-center justify-between px-6 shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">🎁</span>
            <div className="text-left">
              <span className="block text-sm">Mis Recompensas</span>
              <span className="block text-[10px] text-text-secondary font-normal italic">Canjear puntos por premios</span>
            </div>
          </div>
          <span className="text-accent text-lg">→</span>
        </button>

        <button
          onClick={() => onNavigateSubPage('metrics')}
          className="w-full py-5 rounded-2xl bg-bg-card border border-border text-text-primary font-bold hover:bg-bg-elevated transition-all flex items-center justify-between px-6 shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <span className="text-2xl">📊</span>
            <div className="text-left">
              <span className="block text-sm">Mis Métricas</span>
              <span className="block text-[10px] text-text-secondary font-normal italic">Progreso y estadísticas detalladas</span>
            </div>
          </div>
          <span className="text-accent text-lg">→</span>
        </button>
      </div>

      {/* MI CUENTA */}
      <div className="bg-bg-card rounded-2xl border border-border p-5 space-y-5 shadow-sm">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
          <span>👤</span> Mi Cuenta
        </h2>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-text-secondary uppercase font-bold tracking-wider ml-1">Nombre / Apodo</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 bg-bg-primary border border-border px-4 py-2.5 rounded-xl text-sm text-text-primary focus:border-accent outline-none"
              />
              <button
                onClick={saveDisplayName}
                disabled={isSavingName || !newName.trim()}
                className="px-6 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all disabled:opacity-50"
              >
                {isSavingName ? '...' : 'OK'}
              </button>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full py-3.5 rounded-xl bg-bg-elevated text-text-primary hover:bg-bg-primary transition-all text-sm font-bold flex items-center justify-center gap-3 border border-border/50"
          >
            {isExporting ? '...' : '📥 Exportar historial (JSON)'}
          </button>
        </div>
      </div>

      {/* ZONA DE PELIGRO */}
      <div className="bg-danger/5 rounded-2xl border border-danger/10 p-5 space-y-4">
        <h2 className="text-[10px] font-black text-danger uppercase tracking-[0.2em] flex items-center gap-2">
          <span>⚠️</span> Cuida tus pasos
        </h2>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setConfirmReset('streaks')}
              className="py-3 px-2 rounded-xl border border-danger/20 text-danger text-[10px] font-bold hover:bg-danger/10 transition-colors uppercase"
            >
              Reiniciar Rachas
            </button>
            <button
              onClick={() => setConfirmReset('points')}
              className="py-3 px-2 rounded-xl border border-danger/20 text-danger text-[10px] font-bold hover:bg-danger/10 transition-colors uppercase"
            >
              Reiniciar Puntos
            </button>
          </div>
          <button
            onClick={() => setConfirmReset('rewards')}
            className="w-full py-3 rounded-xl border border-danger/20 text-danger text-[10px] font-bold hover:bg-danger/10 transition-colors uppercase"
          >
            🎁 Reiniciar Recompensas
          </button>
        </div>
        <button
          onClick={logout}
          className="w-full py-4 rounded-xl bg-bg-card border border-border text-danger hover:bg-danger hover:text-white transition-all text-xs font-black uppercase tracking-widest"
        >
          Cerrar sesión
        </button>
      </div>

      {/* Modales Confirmación */}
      <AnimatePresence>
        {confirmReset !== 'none' && (
          <motion.div 
            className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-bg-card border border-border rounded-3xl p-8 max-w-xs w-full shadow-2xl text-center space-y-5"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
            >
              <div className="text-5xl">🚨</div>
              <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter">¿Confirmar Acción?</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {confirmReset === 'rewards' 
                  ? "¿Reiniciar todas las recompensas? Se eliminarán todos los canjeos. No se puede deshacer."
                  : `Esta acción es irreversible. Se borrarán tus datos de ${confirmReset === 'streaks' ? " racha actual y récords históricos." : " puntuación acumulada."}`
                }
              </p>
              <div className="flex flex-col gap-2 pt-4">
                <button
                  onClick={() => {
                     if (confirmReset === 'streaks') resetStreaks();
                     else if (confirmReset === 'points') resetPoints();
                     else if (confirmReset === 'rewards') resetRewards();
                  }}
                  className="w-full py-4 rounded-2xl bg-danger text-white font-black uppercase tracking-widest text-xs active:scale-95 transition-transform"
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setConfirmReset('none')}
                  className="w-full py-4 rounded-2xl bg-bg-elevated text-text-primary font-bold text-xs"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
