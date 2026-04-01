import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../store';

/**
 * Componente que renderiza los mensajes de feedback (success/error).
 * Se integra en el AppShell para ser global.
 */
export function Toast() {
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`
              pointer-events-auto px-4 py-3 rounded-2xl shadow-lg border border-white/10
              flex items-center gap-3 min-w-[200px] max-w-[320px] backdrop-blur-md
              ${toast.type === 'error' ? 'bg-danger/90' : toast.type === 'success' ? 'bg-success/90' : 'bg-bg-elevated/90'}
            `}
            onClick={() => removeToast(toast.id)}
          >
            <span className="text-xl">
              {toast.type === 'error' ? '⚠️' : toast.type === 'success' ? '✅' : 'ℹ️'}
            </span>
            <p className="text-sm font-bold text-white">
              {toast.message}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
