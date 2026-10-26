import { useEffect, useRef } from 'react';

let openOverlays = 0;

/** True while a create/edit sheet owns the next system Back press. */
export function overlayBackIsOpen(): boolean {
  return openOverlays > 0;
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
      window.history.back();
      openOverlays = Math.max(0, openOverlays - 1);
    };
  }, [isOpen]);
}
