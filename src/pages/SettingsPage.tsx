import { useState, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useHabitStore } from '../store';
import { db } from '../db';
import { calcularTotalPuntos } from '../utils/pointsEngine';
import {
  collectBackup,
  readBackupFile,
  shareOrDownloadBackup,
  type BackupPayload,
} from '../lib/backup';

const MetricsPage = lazy(() =>
  import('./MetricsPage').then((mod) => ({ default: mod.MetricsPage }))
);

interface SettingsPageProps {
  activeSubPage: 'metrics' | null;
  onNavigateSubPage: (sub: 'metrics' | null) => void;
}

export function SettingsPage({ activeSubPage, onNavigateSubPage }: SettingsPageProps) {
  const { user, logout, updateProfile } = useAuthStore();
  const { totalPoints, setTotalPoints } = useHabitStore();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmReset, setConfirmReset] = useState<'none' | 'streaks' | 'points' | 'app'>('none');

  const [newName, setNewName] = useState(user?.displayName || '');
  const [isSavingName, setIsSavingName] = useState(false);

  const importInputRef = useRef<HTMLInputElement>(null);

  if (activeSubPage === 'metrics') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-bg-primary" />}>
        <MetricsPage onBack={() => onNavigateSubPage(null)} />
      </Suspense>
    );
  }

  async function handleExport() {
    if (!user || isExporting) return;
    try {
      setIsExporting(true);
      const payload = await collectBackup(user);
      await shareOrDownloadBackup(payload);
    } catch (error) {
      console.error('Export error:', error);
      const code = error instanceof Error ? error.message : '';
      alert(
        code === 'too_large'
          ? 'El respaldo supera los 25 MB, así que no se podría volver a importar. No se generó el archivo.'
          : 'No se pudo exportar. En el celular debería abrirse la hoja para guardar o compartir el JSON.',
      );
    } finally {
      setIsExporting(false);
    }
  }

  async function applyBackup(data: BackupPayload) {
    if (!user) return;
    await db.transaction('rw', db.tables, async () => {
      await db.habits.clear();
      await db.habitLogs.clear();
      await db.journalEntries.clear();
      await db.tasks.clear();
      await db.streaks.clear();
      await db.badges.clear();
      await db.pointEntries.clear();

      const userId = user.id;
      const reasignar = <T extends { userId?: string }>(item: T): T => ({ ...item, userId });

      if (data.habitos?.length) await db.habits.bulkAdd(data.habitos.map(reasignar));
      if (data.logs?.length) await db.habitLogs.bulkAdd(data.logs);
      if (data.journal?.length) await db.journalEntries.bulkAdd(data.journal.map(reasignar));
      if (data.tasks?.length) await db.tasks.bulkAdd(data.tasks.map(reasignar));
      if (data.streaks?.length) await db.streaks.bulkPut(data.streaks);
      if (data.badges?.length) await db.badges.bulkAdd(data.badges);
      if (data.pointEntries?.length) {
        const reasignados = data.pointEntries.map(reasignar);
        await db.pointEntries.bulkAdd(reasignados);
        setTotalPoints(calcularTotalPuntos(reasignados));
      }
    });

    if (data.usuario) {
      await updateProfile({
        displayName: data.usuario.displayName,
        accentColor: data.usuario.accentColor,
      });
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user || !e.target.files?.length) return;
    const file = e.target.files[0];
    setIsImporting(true);
    try {
      const data = await readBackupFile(file);
      await applyBackup(data);
      alert('Datos importados correctamente. La página se recargará.');
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      const code = error instanceof Error ? error.message : '';
      const message =
        code === 'too_large'
          ? 'El archivo es demasiado grande (máximo 25 MB).'
          : code === 'empty_backup'
            ? 'El archivo no tiene hábitos, tareas ni diario para importar.'
            : 'El archivo no es un respaldo válido. No se modificaron tus datos.';
      alert(message);
    } finally {
      setIsImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }

  const resetStreaks = async () => {
    if (!user) return;
    try {
      const streaks = await db.streaks.toArray();
      for (const s of streaks) {
        await db.streaks.update(s.habitId, {
          rachaActual: 0,
          rachaMaxima: 0,
          estado: 'rota',
          ultimoCheck: new Date().toISOString()
        });
      }
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
      setTotalPoints(0);
      setConfirmReset('none');
    } catch (e) {
      console.error(e);
    }
  };

  const resetApp = async () => {
    if (!user) return;
    try {
      await db.delete();
      await db.open();
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const saveDisplayName = async () => {
    if (!user || !newName.trim()) return;
    try {
      setIsSavingName(true);
      await updateProfile({ displayName: newName.trim() });
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

      <div className="bg-gradient-to-br from-bg-card to-bg-elevated/40 rounded-3xl border border-border p-6 shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-accent uppercase tracking-widest">Tus Puntos de Vida</p>
          <p className="text-4xl font-black text-text-primary tracking-tighter">⭐ {totalPoints}</p>
        </div>
        <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-2xl animate-pulse">
          🏆
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
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

      <div className="bg-bg-card rounded-2xl border border-border p-5 space-y-5 shadow-sm">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
          <span>👤</span> Mi Perfil
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

          <div>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json,text/plain"
              onChange={handleImport}
              className="sr-only"
            />
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting}
              className="w-full py-3.5 rounded-xl bg-bg-elevated text-text-primary hover:bg-bg-primary transition-all text-sm font-bold flex items-center justify-center gap-3 border border-border/50"
            >
              {isImporting ? '...' : '📤 Importar respaldo (JSON)'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-danger/5 rounded-2xl border border-danger/10 p-5 space-y-4">
        <h2 className="text-[10px] font-black text-danger uppercase tracking-[0.2em] flex items-center gap-2">
          <span>⚠️</span> Zona de Peligro
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
            onClick={() => setConfirmReset('app')}
            className="w-full py-3 rounded-xl border border-danger/20 text-danger text-[10px] font-bold hover:bg-danger/10 transition-colors uppercase"
          >
            Reiniciar App
          </button>
        </div>
        <button
          onClick={logout}
          className="w-full py-4 rounded-xl bg-bg-card border border-border text-danger hover:bg-danger hover:text-white transition-all text-xs font-black uppercase tracking-widest"
        >
          Cerrar sesión
        </button>
      </div>

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
              <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter">
                {confirmReset === 'app' ? '¿Reiniciar App?' : '¿Confirmar Acción?'}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {confirmReset === 'app'
                  ? 'Se eliminarán TODOS tus datos (hábitos, tareas, diario, puntos, rachas y badges). Esta acción es irreversible. Solo se puede recuperar con un respaldo ya guardado de hasta 25 MB.'
                  : `Esta acción es irreversible. Se borrarán tus datos de ${confirmReset === 'streaks' ? 'racha actual y récords históricos.' : 'puntuación acumulada.'}`
                }
              </p>
              <div className="flex flex-col gap-2 pt-4">
                <button
                  onClick={() => {
                    if (confirmReset === 'streaks') resetStreaks();
                    else if (confirmReset === 'points') resetPoints();
                    else if (confirmReset === 'app') resetApp();
                  }}
                  className="w-full py-4 rounded-2xl bg-danger text-white font-black uppercase tracking-widest text-xs active:scale-95 transition-transform"
                >
                  {confirmReset === 'app' ? 'Reiniciar todo' : 'Eliminar'}
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
