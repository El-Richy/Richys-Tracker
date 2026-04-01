import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { TabBar, type TabId } from './TabBar';
import { BadgeToast } from './metrics/BadgeToast';
import { Toast } from './Toast';
import { HomePage } from '../pages/HomePage';
import { HabitsPage } from '../pages/HabitsPage';
import { TasksPage } from '../pages/TasksPage';
import { JournalPage } from '../pages/JournalPage';
import { SettingsPage } from '../pages/SettingsPage';

/**
 * Layout principal post-login.
 * Contiene la TabBar fija abajo y el contenido activo arriba.
 */
export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>('inicio');
  const [activeSubPage, setActiveSubPage] = useState<'metrics' | 'rewards' | null>(null);

  // --- Manejo de Retroceso (Smart Navigation) ---
  useEffect(() => {
    // Estado inicial: empujamos un punto de entrada si no hay uno
    if (!window.history.state) {
      window.history.replaceState({ tab: 'inicio', sub: null }, "");
    }

    const handlePopState = () => {
      if (activeSubPage) {
        // Si hay subpágina, la cerramos
        setActiveSubPage(null);
        // "Consumimos" el evento de atrás eliminando la subpágina del estado visual
      } else if (activeTab !== 'inicio') {
        // Si no es inicio, volvemos a inicio
        setActiveTab('inicio');
      } else {
        // Si ya estamos en inicio, el popstate natural sacará al usuario de la app
        // (No necesitamos hacer nada más)
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, activeSubPage]);

  // Al cambiar de tab, reseteamos la subpágina
  const handleTabChange = (tab: TabId) => {
    if (tab !== activeTab) {
      // Empujamos nuevo estado para que "Atrás" funcione
      window.history.pushState({ tab, sub: null }, "");
    }
    setActiveTab(tab);
    setActiveSubPage(null);
  };

  const navigateToRewards = () => {
    if (activeSubPage !== 'rewards') {
      window.history.pushState({ tab: 'settings', sub: 'rewards' }, "");
    }
    setActiveTab('settings');
    setActiveSubPage('rewards');
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Badge toast global */}
      <BadgeToast />

      {/* Toast de sistema global */}
      <Toast />

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
            <HomePage 
              onNavigate={handleTabChange} 
              onNavigateToRewards={navigateToRewards}
            />
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


