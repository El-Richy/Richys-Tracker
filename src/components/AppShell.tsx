import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TabBar, TAB_ORDER, type TabId } from './TabBar';
import { BadgeToast } from './metrics/BadgeToast';
import { Toast } from './Toast';
import { HomePage } from '../pages/HomePage';
import { HabitsPage } from '../pages/HabitsPage';
import { TasksPage } from '../pages/TasksPage';
import { JournalPage } from '../pages/JournalPage';
import { SettingsPage } from '../pages/SettingsPage';
import { useTabSwipe } from '../hooks/useTabSwipe';
import { selectionTick } from '../lib/haptics';
import { QuickActionsHost } from './QuickActionsHost';

/**
 * Layout principal post-login.
 * Contiene la TabBar fija abajo y el contenido activo arriba.
 */
export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>('inicio');
  const [activeSubPage, setActiveSubPage] = useState<'metrics' | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ tab: 'inicio', sub: null }, "");
    }

    const handlePopState = () => {
      if (activeSubPage) {
        setActiveSubPage(null);
      } else if (activeTab !== 'inicio') {
        setActiveTab('inicio');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, activeSubPage]);

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const handleTabChange = useCallback((tab: TabId) => {
    if (tab !== activeTabRef.current) {
      window.history.pushState({ tab, sub: null }, "");
      selectionTick();
      setActiveTab(tab);
    }
    setActiveSubPage(null);
  }, []);

  const onSwipe = useCallback((direction: -1 | 1) => {
    if (activeSubPage) {
      if (direction === -1) setActiveSubPage(null);
      return;
    }
    const idx = TAB_ORDER.indexOf(activeTab);
    const next = idx + direction;
    if (next >= 0 && next < TAB_ORDER.length) {
      handleTabChange(TAB_ORDER[next]);
    }
  }, [activeSubPage, activeTab, handleTabChange]);

  useTabSwipe(shellRef, onSwipe);

  return (
    <div ref={shellRef} className="min-h-screen bg-bg-primary">
      {/* Badge toast global */}
      <BadgeToast />

      {/* Toast de sistema global */}
      <Toast />
      <QuickActionsHost />

      {/* Content area — pb-20 para no tapar con TabBar */}
      <AnimatePresence mode="wait">
        <motion.main
          key={activeSubPage || activeTab}
          className="pb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {activeTab === 'inicio' && (
            <HomePage onNavigate={handleTabChange} />
          )}
          {activeTab === 'tasks' && <TasksPage />}
          {activeTab === 'journal' && <JournalPage />}
          {activeTab === 'habits' && <HabitsPage />}
          {activeTab === 'settings' && (
            <SettingsPage
              activeSubPage={activeSubPage}
              onNavigateSubPage={setActiveSubPage}
            />
          )}
        </motion.main>
      </AnimatePresence>

      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}


