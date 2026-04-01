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

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-card border-t border-border z-30 pb-safe">
      <div className="flex max-w-lg mx-auto relative">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative ${
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
    </nav>
  );
}

