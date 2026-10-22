import { useState, useCallback } from 'react';

/**
 * Hook para manejar un campo de formulario con validación en blur.
 * El error se muestra al salir del campo y se limpia al escribir.
 */
export function useFormField() {
  const [error, setError] = useState<string | null>(null);

  const requireField = useCallback((value: string, message: string): boolean => {
    if (!value.trim()) {
      setError(message);
      return false;
    }
    setError(null);
    return true;
  }, []);

  const clearOnChange = useCallback(() => {
    if (error) setError(null);
  }, [error]);

  return { error, setError, requireField, clearOnChange };
}