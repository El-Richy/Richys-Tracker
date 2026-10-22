import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = 'Eliminar',
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      try { dialog.showModal(); } catch { /* ya está abierto (StrictMode) */ }
    } else {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    function onNativeCancel(e: Event) {
      e.preventDefault();
      onCancel();
    }
    dialog.addEventListener('cancel', onNativeCancel);
    return () => dialog.removeEventListener('cancel', onNativeCancel);
  }, [onCancel]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === dialogRef.current) onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="m-auto rounded-3xl p-8 max-w-xs w-full bg-bg-card border border-border shadow-2xl text-center space-y-5 backdrop:bg-black/90"
    >
      {open && (
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <div className="text-5xl">🚨</div>
          <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter">{title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
          <div className="flex flex-col gap-2 pt-4">
            <button
              onClick={onConfirm}
              className="w-full py-4 rounded-2xl bg-danger text-white font-black uppercase tracking-widest text-xs active:scale-95 transition-transform"
            >
              {confirmLabel}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-4 rounded-2xl bg-bg-elevated text-text-primary font-bold text-xs"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}
    </dialog>
  );
}