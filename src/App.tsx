import { useEffect } from 'react';
import { useAuthStore, useUiStore } from './store';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingPage } from './pages/OnboardingPage';
import { AppShell } from './components/AppShell';
import type { QuickAction } from './store/uiStore';

function shortcutFromUrl(url?: string | null): QuickAction | null {
  if (!url) return null;
  if (url.includes('shortcut/note')) return 'note';
  if (url.includes('shortcut/journal')) return 'journal';
  if (url.includes('shortcut/photo')) return 'photo';
  return null;
}

function App() {
  const { user, isLoading, initialize } = useAuthStore();
  const openQuickAction = useUiStore((s) => s.openQuickAction);

  useEffect(() => {
    initialize();
    void import('@capacitor/splash-screen').then(({ SplashScreen }) => {
      void SplashScreen.hide().catch(() => {});
    });
  }, [initialize]);

  useEffect(() => {
    let handle: { remove: () => Promise<void> } | undefined;
    let cancelled = false;
    void import('@capacitor/app').then(async ({ App: CapApp }) => {
      const launch = await CapApp.getLaunchUrl();
      if (!cancelled) {
        const action = shortcutFromUrl(launch?.url);
        if (action) openQuickAction(action);
      }
      handle = await CapApp.addListener('appUrlOpen', (event) => {
        const action = shortcutFromUrl(event.url);
        if (action) openQuickAction(action);
      });
    });
    return () => {
      cancelled = true;
      void handle?.remove();
    };
  }, [openQuickAction]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <OnboardingPage />;
  }

  return <AppShell />;
}

export default App;
