import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SubtaskItem } from './SubtaskItem';
import { StreakIndicator } from './StreakIndicator';
import { useHabitStore } from '../store';
import type { Habit, HabitLog } from '../types';

interface HabitCardProps {
  habit: Habit;
  log: HabitLog | undefined;
  index?: number;
  onToggleCheck: () => void;
  onToggleSubtask: (subtaskId: string) => void;
  onAddSubtask?: (name: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

import { getLocalDateStr, subtractDays } from '../utils/dateUtils';

export function HabitCard({
  habit,
  log,
  index = 0,
  onToggleCheck,
  onToggleSubtask,
  onAddSubtask,
  onEdit,
  onDelete,
}: HabitCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allLogs = useHabitStore((s) => s.logs || []);
  const logs = useMemo(() => allLogs.filter((l: HabitLog) => l.habitId === habit.id), [allLogs, habit.id]);
  const streak = useHabitStore((s) => s.streaks?.find((st) => st.habitId === habit.id) ?? null);
  const isChecked = log?.completado ?? false;
  const hasSubtasks = habit.subtareas.length > 0;
  const completedSubtasks = log?.subtareasCompletadas ?? [];

  // Mejora 5: Racha semanal (últimos 7 días)
  const last7Days = useMemo(() => {
    const today = getLocalDateStr();
    return Array.from({ length: 7 }, (_, i) => {
      const dateStr = subtractDays(today, 6 - i);
      const logEntry = logs.find(l => l.fecha === dateStr);
      const fecha = new Date(dateStr + 'T00:00:00');
      const diaNombre = ['D','L','M','X','J','V','S'][fecha.getDay()];
      return {
        dateStr,
        completado: logEntry?.completado ?? false,
        dia: diaNombre
      };
    });
  }, [logs]);

  return (
    <motion.div
      layout
      className="bg-bg-card rounded-xl border border-border"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ 
        duration: 0.2,
        delay: index * 0.05,
        ease: "easeOut"
      }}
    >
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 p-4">
        {/* Color indicator + icono */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: `${habit.color}20` }}
        >
          {habit.icono}
        </div>

        {/* Nombre + Racha */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`text-base font-bold truncate transition-colors ${
                isChecked ? 'text-text-secondary line-through' : 'text-text-primary'
              }`}
            >
              {habit.nombre}
            </h3>
            <StreakIndicator streak={streak} />
          </div>

          {/* Mejora 5: Racha semanal (últimos 7 días) — distribuido */}
          <div className="flex justify-between items-center mt-3 px-1 border-t border-border pt-2">
            {last7Days.map((day: { completado: boolean; dia: string; }, i: number) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  day.completado ? 'bg-accent shadow-[0_0_8px_rgba(240,97,26,0.3)]' : 'bg-bg-elevated'
                }`} />
                <span className="text-[10px] text-text-secondary/60 leading-none">
                  {day.dia}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Check button */}
        <motion.button
          type="button"
          onClick={onToggleCheck}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            isChecked
              ? 'border-success bg-success'
              : 'border-text-secondary/30 hover:border-accent'
          }`}
          whileTap={{ scale: 0.85 }}
        >
          <AnimatePresence mode="wait">
            {isChecked && (
              <motion.svg
                key="check"
                viewBox="0 0 12 12"
                className="w-3.5 h-3.5 text-white"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1.2, rotate: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 500, 
                  damping: 15,
                  delay: 0.1 
                }}
              >
                <motion.path
                  d="M2 6L5 9L10 3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.2, delay: 0.2 }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Menu button */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors"
          >
            ⋯
          </button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                className="absolute right-0 top-10 bg-bg-elevated border border-border rounded-lg shadow-lg z-10 min-w-[120px] overflow-hidden"
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
                transition={{ duration: 0.15 }}
              >
                <button
                  type="button"
                  onClick={() => { setShowMenu(false); onEdit(); }}
                  className="w-full px-4 py-2.5 text-sm text-text-primary hover:bg-bg-card text-left transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  onClick={() => { 
                    console.log('Click en eliminar detectado', habit.id);
                    setShowMenu(false); 
                    onDelete(); 
                  }}
                  className="w-full px-4 py-2.5 text-sm text-danger hover:bg-bg-card text-left transition-colors"
                >
                  🗑️ Eliminar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Expand toggle o Botón añadir subtarea ──── */}
      {hasSubtasks ? (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 flex items-center gap-2 text-xs text-text-secondary hover:text-accent border-t border-border/50 transition-colors"
        >
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.span>
          {isExpanded 
            ? 'Ocultar subtareas' 
            : `Mostrar subtareas (${completedSubtasks.length}/${habit.subtareas.length})`}
        </button>
      ) : (
        !isExpanded && onAddSubtask && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="w-full px-4 py-2 flex items-center justify-center gap-2 text-xs text-text-secondary hover:text-accent font-medium border-t border-border/50 transition-colors"
          >
            <span className="font-bold">+</span> Añadir subtarea
          </button>
        )
      )}

      {/* ── Subtask list (animated) ────────────────── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="px-4 pb-3 border-t border-border/50"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="pt-2 space-y-0.5">
              {habit.subtareas.map((sub) => (
                <SubtaskItem
                  key={sub.id}
                  nombre={sub.nombre}
                  isCompleted={completedSubtasks.includes(sub.id)}
                  onToggle={() => onToggleSubtask(sub.id)}
                />
              ))}
              
              {/* Añadir subtarea inline */}
              {onAddSubtask && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (newSubtaskName.trim()) {
                      onAddSubtask(newSubtaskName.trim());
                      setNewSubtaskName('');
                    }
                  }}
                  className="flex items-center gap-2 mt-2 px-3 py-1 text-sm bg-bg-primary/50 rounded-lg group"
                >
                  <span className="text-text-secondary/50 font-bold group-within:text-accent ml-1">+</span>
                  <input
                    type="text"
                    value={newSubtaskName}
                    onChange={(e) => setNewSubtaskName(e.target.value)}
                    placeholder="Añadir subtarea..."
                    className="flex-1 bg-transparent border-none text-text-primary placeholder:text-text-secondary/50 focus:outline-none py-1.5"
                    // autoFocus para UX cuando pulsan "Añadir subtarea"
                  />
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
