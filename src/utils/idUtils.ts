/**
 * Genera un ID compatible con UUID v4.
 * Incluye un fallback para contextos no seguros (HTTP por IP) donde 
 * crypto.randomUUID no está disponible.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback simple compatible con UUID v4 (basado en timestamp y random)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
