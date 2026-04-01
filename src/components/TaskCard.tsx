import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SubtaskItem } from './SubtaskItem';
import type { Task } from '../types';
import { getLocalDateStr } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  index?: number;
  onToggleCheck: () => void;
  onToggleSubtask: (subtaskId: string) => void;
  onAddSubtask: (name: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TaskCard({
  task,
  index = 0,
  onToggleCheck,
  onToggleSubtask,
  onAddSubtask,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const toggleMenu = () => {
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 120, // Ancho aproximado del menú
      });
    }
    setShowMenu(!showMenu);
  };

  const isCompleted = task.completada;
  const hasSubtasks = task.subtareas.length > 0;
  const completedSubtasksCount = task.subtareas.filter(s => {
      return s.completada;
  }).length;

  // Determinar si está vencida
  const hoy = getLocalDateStr();
  const isOverdue = task.deadline && task.deadline < hoy && !isCompleted;

  const priorityColors = {
    alta: '#EF4444',
    media: '#F59E0B',
    baja: '#6B7280',
  };

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
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <motion.button
          type="button"
          onClick={onToggleCheck}
          className={`mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
            isCompleted
              ? 'border-success bg-success'
              : 'border-text-secondary/30 hover:border-accent'
          }`}
          whileTap={{ scale: 0.85 }}
        >
          <AnimatePresence mode="wait">
            {isCompleted && (
              <motion.svg 
                key="check"
                viewBox="0 0 12 12" 
                className="w-3 h-3 text-white"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1.1, rotate: 0 }}
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

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-semibold truncate transition-colors ${
                isCompleted ? 'text-text-secondary line-through' : 'text-text-primary'
              }`}
            >
              {task.titulo}
            </h3>
            
            {/* Priority Badge */}
            <span 
              className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: priorityColors[task.prioridad] }}
            >
              {task.prioridad.charAt(0).toUpperCase() + task.prioridad.slice(1)}
            </span>
          </div>

          {task.descripcion && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">
              {task.descripcion}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            {task.deadline && (
              <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-danger font-bold' : 'text-text-secondary'}`}>
                📅 {isOverdue ? 'Vencida' : task.deadline}
              </span>
            )}
            {hasSubtasks && (
              <span className="text-xs text-text-secondary">
                {completedSubtasksCount}/{task.subtareas.length} subtareas
              </span>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={toggleMenu}
            className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg-elevated transition-colors"
          >
            ⋯
          </button>

          <AnimatePresence>
            {showMenu && (
              <motion.div
                ref={menuRef}
                className="fixed bg-bg-elevated border border-border rounded-lg shadow-lg z-[100] min-w-[120px] overflow-hidden"
                style={{ top: menuPosition.top, left: menuPosition.left }}
                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -5 }}
              >
                <button
                  onClick={() => { setShowMenu(false); onEdit(); }}
                  className="w-full px-4 py-2.5 text-sm text-text-primary hover:bg-bg-card text-left transition-colors"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => { setShowMenu(false); onDelete(); }}
                  className="w-full px-4 py-2.5 text-sm text-danger hover:bg-bg-card text-left transition-colors"
                >
                  🗑️ Eliminar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expander Subtareas */}
      {hasSubtasks ? (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2 flex items-center gap-2 text-xs text-text-secondary hover:text-accent border-t border-border/50 transition-colors"
        >
          <motion.span animate={{ rotate: isExpanded ? 180 : 0 }}>▼</motion.span>
          {isExpanded ? 'Ocultar subtareas' : 'Mostrar subtareas'}
        </button>
      ) : (
        !isExpanded && (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="w-full px-4 py-2 flex items-center justify-center gap-2 text-xs text-text-secondary hover:text-accent font-medium border-t border-border/50 transition-colors"
          >
            <span className="font-bold">+</span> Añadir subtarea
          </button>
        )
      )}

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="px-4 pb-3 border-t border-border/50"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="pt-2 space-y-0.5">
              {task.subtareas.map((sub) => (
                <SubtaskItem
                  key={sub.id}
                  nombre={sub.nombre}
                  isCompleted={!!sub.completada}
                  onToggle={() => onToggleSubtask(sub.id)}
                />
              ))}

              {/* Añadir subtarea inline */}
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
                  autoFocus
                />
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
