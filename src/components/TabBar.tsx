import { useRef, type MouseEvent, type PointerEvent } from 'react';
import { motion } from 'framer-motion';

export type TabId = 'inicio' | 'tasks' | 'journal' | 'habits' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'inicio', label: 'Inicio', icon: '🏠' },
  { id: 'tasks', label: 'Tareas', icon: '✅' },
  { id: 'journal', label: 'Diario', icon: '📓' },
  { id: 'habits', label: 'Hábitos', icon: '🎯' },
  { id: 'settings', label: 'Ajustes', icon: '⚙️' },
];

export const TAB_ORDER: TabId[] = TABS.map((tab) => tab.id);

const DRAG_THRESHOLD_PX = 8;

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

function tabIndexFromClientX(clientX: number, pill: HTMLElement): number {
  const rect = pill.getBoundingClientRect();
  const width = rect.width;
  if (width <= 0) return 0;
  const slot = width / TAB_ORDER.length;
  const x = Math.min(Math.max(clientX - rect.left, 0), width - 1);
  return Math.min(TAB_ORDER.length - 1, Math.max(0, Math.floor(x / slot)));
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const pillRef = useRef<HTMLDivElement>(null);
  const scrubRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    dragging: false,
  });

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const pill = pillRef.current;
    if (!pill) return;
    scrubRef.current.pointerId = event.pointerId;
    scrubRef.current.startX = event.clientX;
    scrubRef.current.dragging = false;
    try {
      pill.setPointerCapture(event.pointerId);
    } catch {
      // Capture is best-effort; scrub still works while the pointer stays on the pill.
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const scrub = scrubRef.current;
    if (scrub.pointerId !== event.pointerId) return;
    const pill = pillRef.current;
    if (!pill) return;
    if (Math.abs(event.clientX - scrub.startX) > DRAG_THRESHOLD_PX) {
      scrub.dragging = true;
    }
    if (!scrub.dragging) return;
    const idx = tabIndexFromClientX(event.clientX, pill);
    const next = TAB_ORDER[idx];
    if (next !== activeTab) onTabChange(next);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (scrubRef.current.pointerId !== event.pointerId) return;
    scrubRef.current.pointerId = null;
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    if (scrubRef.current.pointerId !== event.pointerId) return;
    scrubRef.current.pointerId = null;
    scrubRef.current.dragging = false;
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!scrubRef.current.dragging) return;
    event.preventDefault();
    event.stopPropagation();
    scrubRef.current.dragging = false;
  }

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-30 flex justify-center px-4 pointer-events-none"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div
        ref={pillRef}
        role="tablist"
        aria-label="Navegación"
        data-no-swipe
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}
        className="relative flex w-full max-w-sm pointer-events-auto touch-pan-x rounded-full bg-bg-card border border-border py-1.5 px-1.5 shadow-lg"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1 transition-colors relative ${
                isActive ? 'text-accent' : 'text-text-secondary'
              }`}
            >
              <span className="text-xl sm:text-lg">{tab.icon}</span>
              <span className="text-[9px] sm:text-[10px] font-medium hidden min-[380px]:block truncate max-w-full px-1">
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  className="absolute top-0 h-0.5 w-8 sm:w-12 bg-accent rounded-full"
                  layoutId="tab-indicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
