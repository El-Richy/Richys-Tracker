import { motion, AnimatePresence } from 'framer-motion';
import type { JournalEntry } from '../types';
import { useState } from 'react';

interface JournalDetailModalProps {
  entry: JournalEntry;
  onClose: () => void;
}

const MOODS: Record<number, { emoji: string, label: string }> = {
  1: { emoji: '😞', label: 'Muy mal' },
  2: { emoji: '😕', label: 'Mal' },
  3: { emoji: '😐', label: 'Neutral' },
  4: { emoji: '🙂', label: 'Bien' },
  5: { emoji: '😄', label: 'Excelente' },
};

export function JournalDetailModal({ entry, onClose }: JournalDetailModalProps) {
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const date = new Date(entry.creadoEn);
  const dateStr = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);

  return (
    <AnimatePresence>
      <motion.div
        data-no-swipe
        className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-0 lg:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-bg-card w-full h-full lg:h-auto lg:max-w-2xl lg:rounded-3xl overflow-hidden border border-border shadow-2xl flex flex-col"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 flex items-center justify-between z-10 sticky top-0 bg-bg-card/80 backdrop-blur-md border-b border-border">
            <h3 className="text-text-secondary font-bold text-xs uppercase tracking-[0.2em]">
              {entry.tipo === 'note' ? 'Nota Rápida' : 'Entrada del Diario'}
            </h3>
            <button 
              onClick={onClose} 
              className="text-text-secondary hover:text-white p-2 rounded-full hover:bg-bg-elevated transition-all"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 custom-scrollbar">
            {/* Mood & Fecha */}
            <div className="flex flex-col items-center text-center space-y-4">
              {entry.estadoAnimo ? (
                <>
                  <motion.span 
                    className="text-7xl lg:text-8xl drop-shadow-xl"
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12 }}
                  >
                    {MOODS[entry.estadoAnimo].emoji}
                  </motion.span>
                  <div>
                    <p className="text-accent font-bold text-lg mb-1">{MOODS[entry.estadoAnimo].label}</p>
                    <p className="text-text-secondary text-sm capitalize">{dateStr}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-bg-elevated rounded-full flex items-center justify-center text-4xl shadow-inner border border-border/50">
                    📝
                  </div>
                  <div>
                    <p className="text-text-secondary text-sm capitalize">{dateStr}</p>
                  </div>
                </>
              )}
            </div>

            {/* Galería Horizontal */}
            {entry.fotos && entry.fotos.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-4 px-2 snap-x no-scrollbar">
                {entry.fotos.map((foto, idx) => (
                  <motion.div 
                    key={idx} 
                    className="shrink-0 w-64 aspect-[3/4] rounded-2xl overflow-hidden border border-border shadow-lg snap-center cursor-zoom-in"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setFullScreenImage(foto)}
                  >
                    <img src={foto} className="w-full h-full object-cover" alt="Journal memory" />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Contenido */}
            <div className="space-y-6">
              {entry.titulo && (
                <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                  {entry.titulo}
                </h2>
              )}
              
              <div className="bg-bg-elevated/30 p-6 rounded-2xl border border-border/50">
                <p className="text-text-primary text-lg leading-relaxed whitespace-pre-wrap font-medium">
                  {entry.texto}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-border bg-bg-elevated/20">
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl bg-white text-black font-extrabold hover:bg-gray-200 transition-all shadow-xl active:scale-[0.98]"
            >
              Cerrar
            </button>
          </div>
        </motion.div>

        {/* Overlay Imagen a pantalla completa */}
        <AnimatePresence>
          {fullScreenImage && (
            <motion.div
              className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                setFullScreenImage(null);
              }}
            >
              <button 
                className="absolute top-8 right-8 text-white text-3xl"
                onClick={() => setFullScreenImage(null)}
              >✕</button>
              <motion.img 
                src={fullScreenImage} 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
