/** Short selection tick for tab changes. Optional; never throws. */
export function selectionTick(): void {
  try {
    navigator.vibrate?.(12);
  } catch {
    // Vibration may be blocked or unimplemented.
  }
}
