import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickNoteModalProps {
  onSubmit: (data: { titulo?: string; texto: string }) => void;
  onClose: () => void;
}

export function QuickNoteModal({ onSubmit, onClose }: QuickNoteModalProps) {
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) {
      setError('Escribe algo en tu nota.');
      return;
    }
    onSubmit({
      titulo: titulo.trim() || undefined,
      texto: texto.trim(),
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-0 lg:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-bg-card w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto border border-border flex flex-col shadow-2xl"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white">Nota Rápida 📝</h2>
                <p className="text-xs text-text-secondary mt-1 uppercase tracking-widest font-bold">Captura una idea al instante</p>
              </div>
              <button 
                type="button" 
                onClick={onClose} 
                className="text-text-secondary hover:text-white p-2 bg-bg-elevated rounded-full transition-colors"
              >✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Título (Opcional)</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Idea, recordatorio, pensamiento..."
                  className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border text-text-primary focus:border-accent outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 px-1">Contenido de la nota</label>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escribe aquí..."
                  autoFocus
                  className="w-full px-4 py-4 rounded-xl bg-bg-primary border border-border text-text-primary focus:border-accent outline-none transition-all min-h-[160px] resize-none leading-relaxed"
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="text-danger text-xs font-bold bg-danger/10 p-3 rounded-xl text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-accent text-white font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 active:scale-[0.98]"
            >
              Guardar Nota 🚀
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
