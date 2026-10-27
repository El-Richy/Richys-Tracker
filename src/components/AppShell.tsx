import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TabBar, type TabId } from './TabBar';
import { BadgeToast } from './metrics/BadgeToast';
import { Toast } from './Toast';
import { HomePage } from '../pages/HomePage';
import { HabitsPage } from '../pages/HabitsPage';
import { TasksPage } from '../pages/TasksPage';
import { JournalPage } from '../pages/JournalPage';
import { SettingsPage } from '../pages/SettingsPage';
import { useTabSwipe } from '../hooks/useTabSwipe';
import { selectionTick } from '../lib/haptics';
import { swipeDestination, type JournalPane } from '../utils/journalSwipe';
import { consumeOverlayPop } from '../lib/overlayHistory';
import { QuickActionsHost } from './QuickActionsHost';

/**
 * Layout principal post-login.
 * Contiene la TabBar fija abajo y el contenido activo arriba.
 */
export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>('inicio');
  const [journalPane, setJournalPane] = useState<JournalPane>('journal');
  const [activeSubPage, setActiveSubPage] = useState<'metrics' | null>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ tab: 'inicio', sub: null }, "");
    }

    const handlePopState = () => {
      if (consumeOverlayPop()) return;
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

  const journalPaneRef = useRef(journalPane);
  journalPaneRef.current = journalPane;

  const goToTab = useCallback((tab: TabId) => {
    if (tab !== activeTabRef.current) {
      window.history.pushState({ tab, sub: null }, "");
      selectionTick();
      setActiveTab(tab);
    }
    setActiveSubPage(null);
  }, []);

  const handleTabChange = useCallback((tab: TabId) => {
    if (tab === 'journal' && journalPaneRef.current !== 'journal') {
      setJournalPane('journal');
      if (tab === activeTabRef.current) selectionTick();
    }
    goToTab(tab);
  }, [goToTab]);

  const onSwipe = useCallback((direction: -1 | 1) => {
    if (activeSubPage) {
      if (direction === -1) setActiveSubPage(null);
      return;
    }
    const destination = swipeDestination(activeTab, journalPane, direction);
    if (!destination) return;
    const paneChanged = destination.journalPane !== journalPane;
    const tabChanged = destination.tab !== activeTab;
    if (paneChanged) setJournalPane(destination.journalPane);
    if (tabChanged) goToTab(destination.tab);
    else if (paneChanged) selectionTick();
  }, [activeSubPage, activeTab, goToTab, journalPane]);

  useTabSwipe(shellRef, onSwipe);

  return (
    <div ref={shellRef} className="min-h-screen bg-bg-primary touch-pan-y">
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
          {activeTab === 'journal' && (
            <JournalPage filter={journalPane} onFilterChange={setJournalPane} />
          )}
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


