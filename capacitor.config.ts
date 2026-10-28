import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.richys.tracker',
  appName: "Richy's Tracker",
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#0F0F0F',
      showSpinner: false,
    },
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;