const SLOP_PX = 10;

export type SwipeAxis = 'pending' | 'horizontal' | 'vertical';

/** Decide the gesture only after the finger has moved past the slop. */
export function classifySwipe(dx: number, dy: number): SwipeAxis {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax < SLOP_PX && ay < SLOP_PX) return 'pending';
  return ax >= ay ? 'horizontal' : 'vertical';
}

export function tabIndexFromClientX(
  clientX: number,
  rect: { left: number; width: number },
  tabCount: number,
): number {
  if (rect.width <= 0 || tabCount <= 0) return 0;
  const x = Math.min(Math.max(clientX - rect.left, 0), rect.width - 1);
  return Math.min(tabCount - 1, Math.max(0, Math.floor(x / (rect.width / tabCount))));
}
