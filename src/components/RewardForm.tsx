import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RewardFormProps {
  onSubmit: (data: { 
    nombre: string; 
    descripcion: string; 
    precioPuntos: number; 
    icono: string; 
    esRecurrente: boolean; 
  }) => void;
  onClose: () => void;
}

const ICONS = ['🎁', '🍕', '🎮', '🎥', '🍦', '🚲', '👟', '💆', '✈️', '🍹'];

export function RewardForm({ onSubmit, onClose }: RewardFormProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precioPuntos, setPrecioPuntos] = useState(100);
  const [icono, setIcono] = useState('🎁');
  const [esRecurrente, setEsRecurrente] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || precioPuntos <= 0) return;
    onSubmit({ nombre, descripcion, precioPuntos, icono, esRecurrente });
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-bg-card w-full max-w-sm rounded-2xl border border-border shadow-2xl p-6"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-text-primary">Crear Recompensa</h3>
            <button onClick={onClose} className="text-text-secondary text-2xl hover:text-white transition-colors">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Icono */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Icono</label>
              <div className="grid grid-cols-5 gap-2">
                {ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcono(i)}
                    className={`text-2xl p-2 rounded-xl border-2 transition-all ${
                      icono === i ? 'border-accent bg-accent/10' : 'border-transparent hover:bg-bg-elevated'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Nombre</label>
              <input
                autoFocus
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Noche de pizza"
                className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border text-text-primary outline-none focus:border-accent"
              />
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Precio (Puntos)</label>
              <div className="relative">
                <input
                  type="number"
                  value={precioPuntos}
                  onChange={(e) => setPrecioPuntos(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border text-text-primary outline-none focus:border-accent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-accent font-bold">puntos</span>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalla tu premio..."
                className="w-full px-4 py-3 rounded-xl bg-bg-primary border border-border text-text-primary outline-none focus:border-accent min-h-[80px] resize-none"
              />
            </div>

            {/* Toggle Recurrencia (Mejora 3) */}
            <div className="bg-bg-primary p-4 rounded-xl border border-border/50 space-y-2 cursor-pointer transition-all active:scale-[0.98]" onClick={() => setEsRecurrente(!esRecurrente)}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-text-primary">¿Recompensa semanal?</span>
                <div className={`w-10 h-5 rounded-full transition-colors relative ${esRecurrente ? 'bg-accent' : 'bg-bg-elevated'}`}>
                  <motion.div 
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                    animate={{ x: esRecurrente ? 20 : 2 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-text-secondary italic">Se podrá canjear de nuevo cada 7 días una vez alcanzado el límite.</p>
            </div>

            <button
              type="submit"
              disabled={!nombre.trim()}
              className="w-full py-4 rounded-xl bg-accent text-white font-extrabold hover:bg-accent/90 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50"
            >
              Crear
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
