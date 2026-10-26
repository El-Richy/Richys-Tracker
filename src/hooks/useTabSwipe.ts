import { useEffect, useRef, type RefObject } from 'react';
import { classifySwipe } from '../utils/swipeAxis';

const MIN_DISTANCE = 48;
const LEFT_EDGE_GUARD_PX = 16;

/**
 * Horizontal tab swipe. Listeners stay on the shell for its whole life.
 * A horizontal move claims the gesture so vertical scroll cannot cancel it.
 * Empty areas of the shell count: the listener is on the shell, not on cards.
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
      if (!(target instanceof Element)) return false;
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
    };

    const claimHorizontal = (event: PointerEvent) => {
      lockedHorizontal = true;
      try {
        root.setPointerCapture(event.pointerId);
      } catch {
        // Capture is best-effort. touchmove still preventDefault below.
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!tracking || pointerId !== event.pointerId) return;
      if (lockedHorizontal) return;
      const axis = classifySwipe(event.clientX - startX, event.clientY - startY);
      if (axis === 'vertical') {
        clearTracking();
        return;
      }
      if (axis === 'horizontal') claimHorizontal(event);
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (!lockedHorizontal) {
        const axis = classifySwipe(touch.clientX - startX, touch.clientY - startY);
        if (axis === 'vertical') {
          clearTracking();
          return;
        }
        if (axis !== 'horizontal') return;
        lockedHorizontal = true;
      }
      if (event.cancelable) event.preventDefault();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!tracking || pointerId !== event.pointerId) {
        clearTracking();
        return;
      }
      const dx = event.clientX - startX;
      const horizontal = lockedHorizontal || classifySwipe(dx, event.clientY - startY) === 'horizontal';
      clearTracking();
      if (!horizontal || Math.abs(dx) < MIN_DISTANCE) return;
      consumed = true;
      onSwipeRef.current(dx < 0 ? 1 : -1);
    };

    const onPointerCancel = () => {
      if (lockedHorizontal) return;
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
    root.addEventListener('touchmove', onTouchMove, { passive: false });
    root.addEventListener('pointerup', onPointerUp);
    root.addEventListener('pointercancel', onPointerCancel);
    root.addEventListener('click', onClickCapture, true);
    return () => {
      root.removeEventListener('pointerdown', onPointerDown);
      root.removeEventListener('pointermove', onPointerMove);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('pointerup', onPointerUp);
      root.removeEventListener('pointercancel', onPointerCancel);
      root.removeEventListener('click', onClickCapture, true);
    };
  }, [shellRef]);
}
