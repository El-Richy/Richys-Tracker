import { useEffect } from 'react';
import { useAuthStore } from './store';
import { SplashScreen } from './components/SplashScreen';
import { AuthPage } from './pages/AuthPage';
import { AppShell } from './components/AppShell';
import { useNotifications } from './hooks/useNotifications';

/**
 * App root con AuthGuard:
 * - isLoading → SplashScreen
 * - !user     → AuthPage
 * - user      → AppShell (tabs)
 */
function App() {
  const { user, isLoading, initialize } = useAuthStore();
  const { requestPermission } = useNotifications();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user) {
      requestPermission();
    }
  }, [user, requestPermission]);

  if (isLoading && !user) {
    return <SplashScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return <AppShell />;
}

export default App;
