import { useRef, useEffect, useCallback } from 'react';

/**
 * Hook para gestionar un `<dialog>` nativo.
 * - Muestra el diálogo al montar con showModal()
 * - Captura Escape (evento cancel) para evitar cierre nativo y llama a onClose
 * - Retorna dialogRef y handlers de click en backdrop y cierre manual
 */
export function useDialog(onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    try { dialog.showModal(); } catch { /* StrictMode: ya abierto */ }

    function onCancel(e: Event) {
      e.preventDefault();
      dialog?.close();
      onClose();
    }
    dialog.addEventListener('cancel', onCancel);
    return () => dialog.removeEventListener('cancel', onCancel);
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
      onClose();
    }
  }, [onClose]);

  const handleClose = useCallback(() => {
    dialogRef.current?.close();
    onClose();
  }, [onClose]);

  return { dialogRef, handleBackdropClick, handleClose };
}