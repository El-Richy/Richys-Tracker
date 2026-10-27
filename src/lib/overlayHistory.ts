import { useEffect, useRef } from 'react';

let openOverlays = 0;
let expectingClosePop = false;

/** Stay when the pop belongs to a sheet, including a close that already dropped the count. */
export function overlayPopAction(open: number, expectingClose: boolean): 'stay' | 'navigate' {
  if (open > 0 || expectingClose) return 'stay';
  return 'navigate';
}

/** True while a create/edit sheet owns the next system Back press. */
export function overlayBackIsOpen(): boolean {
  return overlayPopAction(openOverlays, expectingClosePop) === 'stay';
}

/** AppShell calls this from popstate. A programmatic close consumes one ignored pop. */
export function consumeOverlayPop(): boolean {
  const stay = overlayBackIsOpen();
  if (openOverlays === 0 && expectingClosePop) expectingClosePop = false;
  return stay;
}

/**
 * Push a history entry while `isOpen` so the system Back button closes the
 * sheet instead of leaving the current page.
 */
export function useOverlayHistory(isOpen: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const ownsEntry = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const previous = window.history.state ?? {};
    window.history.pushState({ ...previous, overlay: true }, '');
    openOverlays += 1;
    ownsEntry.current = true;

    const onPop = () => {
      if (!ownsEntry.current) return;
      ownsEntry.current = false;
      onCloseRef.current();
      queueMicrotask(() => {
        openOverlays = Math.max(0, openOverlays - 1);
      });
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (!ownsEntry.current) return;
      ownsEntry.current = false;
      expectingClosePop = true;
      openOverlays = Math.max(0, openOverlays - 1);
      window.history.back();
    };
  }, [isOpen]);
}
