import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { JournalEntry } from '../types';

interface JournalCardProps {
  entry: JournalEntry;
  index?: number;
  onDelete: () => void;
  onEdit: () => void;
  onOpen: () => void;
}

const MOOD_EMOJIS: Record<number, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
};

export function JournalCard({ entry, index = 0, onDelete, onEdit, onOpen }: JournalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);
  
  const menuRef = useRef<HTMLDivElement>(null);

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

  const moodEmoji = MOOD_EMOJIS[entry.estadoAnimo] || '😐';
  
  // Formatear fecha
  const dateObj = new Date(entry.creadoEn);
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);

  const displayDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const hasPhotos = entry.fotos && entry.fotos.length > 0;
  const maxVisiblePhotos = 3;
  const extraPhotosCount = entry.fotos.length - maxVisiblePhotos;

  return (
    <motion.div
      layout
      className="bg-bg-card rounded-xl border border-border overflow-hidden cursor-pointer hover:bg-bg-elevated/30 transition-colors"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ 
        duration: 0.2,
        delay: index * 0.05,
        ease: "easeOut"
      }}
      onClick={onOpen}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{moodEmoji}</span>
            <span className="text-xs text-text-secondary font-medium">
              {displayDate}
            </span>
          </div>
          
          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-text-secondary hover:text-text-primary p-1 transition-colors"
            >
              ⋯
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  className="absolute right-0 top-8 bg-bg-elevated border border-border rounded-lg shadow-lg z-10 min-w-[120px] overflow-hidden"
                  initial={{ opacity: 0, scale: 0.9, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -5 }}
                >
                  <button
                    onClick={() => { setShowMenu(false); onEdit(); }}
                    className="w-full px-4 py-2.5 text-sm text-text-primary hover:bg-bg-card text-left transition-colors border-b border-border/50"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setShowConfirmDelete(true); }}
                    className="w-full px-4 py-2.5 text-sm text-danger hover:bg-bg-card text-left transition-colors"
                  >
                    🗑️ Eliminar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Título y Texto */}
        <div className="relative">
          {(entry as any).titulo && (
            <h4 className="text-sm font-bold text-text-primary mb-1">
              {(entry as any).titulo}
            </h4>
          )}
          <p
            className={`text-sm text-text-primary leading-relaxed transition-all ${
              !isExpanded ? 'line-clamp-3' : ''
            }`}
          >
            {entry.texto}
          </p>
          {entry.texto.length > 150 && (
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="text-accent text-xs font-bold mt-1 hover:underline"
            >
              {isExpanded ? 'Ver menos' : 'Ver más'}
            </button>
          )}
        </div>

        {/* Fotos */}
        {hasPhotos && (
          <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
            {entry.fotos.slice(0, maxVisiblePhotos).map((foto, idx) => (
              <div 
                key={idx} 
                className="relative w-20 h-20 rounded-lg overflow-hidden border border-border cursor-pointer active:scale-95 transition-transform"
                onClick={() => setFotoAmpliada(foto)}
              >
                <img 
                  src={foto} 
                  alt={`Journal photo ${idx}`} 
                  className="w-full h-full object-cover" 
                />
                {idx === maxVisiblePhotos - 1 && extraPhotosCount > 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-sm">
                    +{extraPhotosCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overlay Foto Ampliada */}
      <AnimatePresence>
        {fotoAmpliada && (
          <motion.div
            className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setFotoAmpliada(null);
            }}
          >
            <motion.img
              src={fotoAmpliada}
              className="max-w-full max-h-full object-contain rounded-lg"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Confirm Delete */}
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-bg-card border border-border rounded-xl p-6 max-w-xs w-full shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <h3 className="text-lg font-bold text-text-primary mb-2">¿Eliminar entrada?</h3>
              <p className="text-sm text-text-secondary mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-2 rounded-lg bg-bg-elevated text-text-primary text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowConfirmDelete(false);
                  }}
                  className="flex-1 py-2 rounded-lg bg-danger text-white text-sm font-bold"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

