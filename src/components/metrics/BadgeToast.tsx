import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabits } from '../../hooks/useHabits';
import type { Badge } from '../../types';

/**
 * Toast animado que aparece cuando se desbloquea un badge nuevo.
 * Utiliza el campo 'visto' para asegurar que solo se muestre una vez.
 */
export function BadgeToast() {
  const { badges, confirmBadgeSeen } = useHabits();
  const [toastBadge, setToastBadge] = useState<Badge | null>(null);

  useEffect(() => {
    // Buscamos el primer badge que NO haya sido visto aún
    const pending = badges.find(b => b.visto === false);
    
    if (pending && !toastBadge) {
      setToastBadge(pending);
      
      // Mostrar por 6 segundos (dar tiempo a la animación)
      const timer = setTimeout(() => {
        handleDismiss(pending.id);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [badges, toastBadge]);

  const handleDismiss = (id: string) => {
    setToastBadge(null);
    confirmBadgeSeen(id);
  };

  return (
    <AnimatePresence>
      {toastBadge && (
        <motion.div
          className="fixed top-6 left-1/2 z-50 w-[280px]"
          style={{ x: '-50%' }}
          initial={{ y: -80, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="bg-bg-elevated border border-accent/30 rounded-2xl px-4 py-3 shadow-lg shadow-accent/10 flex items-center gap-3">
            {/* Icono con glow */}
            <div className="relative">
              <motion.span
                className="text-3xl"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {toastBadge.icono}
              </motion.span>
              <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-accent font-semibold uppercase tracking-wider">
                ¡Badge desbloqueado!
              </p>
              <p className="text-sm font-bold text-text-primary truncate">
                {toastBadge.nombre}
              </p>
              <p className="text-[10px] text-text-secondary">
                {toastBadge.descripcion}
              </p>
            </div>

            <button 
              onClick={() => handleDismiss(toastBadge.id)}
              className="text-text-secondary hover:text-text-primary text-xs p-1"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
