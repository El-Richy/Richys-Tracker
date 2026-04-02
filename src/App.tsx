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
  const { requestPermission, clearAllReminders } = useNotifications();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (user) {
      requestPermission();
    } else {
      // Limpiar todo al cerrar sesión para evitar fugas de memoria y notificaciones fantasma
      clearAllReminders();
    }
  }, [user, requestPermission, clearAllReminders]);

  if (isLoading && !user) {
    return <SplashScreen />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return <AppShell />;
}

export default App;
