import { useEffect, useRef, type RefObject } from 'react';

const MIN_DISTANCE = 56;
const LEFT_EDGE_GUARD_PX = 16;

/**
 * Horizontal tab swipe without translating the page.
 * Listeners stay bound for the life of the shell node so click suppression
 * is not dropped when onSwipe identity changes.
 */
export function useTabSwipe(
  shellRef: RefObject<HTMLElement | null>,
  onSwipe: (direction: -1 | 1) => void,
) {
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  useEffect(() => {
    const root = shellRef.current;
    if (!root) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let lockedHorizontal = false;
    let consumed = false;
    let pointerId: number | null = null;

    const isIgnoredTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return Boolean(
        target.closest('input, textarea, select, [contenteditable], [data-no-swipe]'),
      );
    };

    const clearTracking = () => {
      tracking = false;
      lockedHorizontal = false;
      pointerId = null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (isIgnoredTarget(event.target)) return;
      if (event.clientX < LEFT_EDGE_GUARD_PX) return;
      startX = event.clientX;
      startY = event.clientY;
      tracking = true;
      lockedHorizontal = false;
      pointerId = event.pointerId;
      try {
        root.setPointerCapture(event.pointerId);
      } catch {
        // Capture is best-effort when the event did not originate on root.
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!tracking || pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (lockedHorizontal) return;
      if (Math.abs(dy) > Math.abs(dx) * 1.15) {
        clearTracking();
        return;
      }
      if (Math.abs(dx) >= Math.abs(dy) * 1.15 && Math.abs(dx) >= 8) {
        lockedHorizontal = true;
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!tracking || pointerId !== event.pointerId) {
        clearTracking();
        return;
      }
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const horizontal =
        lockedHorizontal || Math.abs(dx) >= Math.abs(dy) * 1.15;
      clearTracking();
      if (!horizontal || Math.abs(dx) < MIN_DISTANCE) return;
      consumed = true;
      onSwipeRef.current(dx < 0 ? 1 : -1);
    };

    const onPointerCancel = () => {
      clearTracking();
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!consumed) return;
      consumed = false;
      event.preventDefault();
      event.stopPropagation();
    };

    root.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('pointermove', onPointerMove);
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerCancel);
    root.addEventListener('click', onClickCapture, true);
    return () => {
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('pointercancel', onPointerCancel);
      root.removeEventListener('click', onClickCapture, true);
    };
  }, [shellRef]);
}
