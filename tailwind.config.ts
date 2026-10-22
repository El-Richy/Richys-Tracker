/** @type {import('tailwindcss').Config} */
import { colors } from './src/theme/colors.ts';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      padding: {
        safe: 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-x': 'env(safe-area-inset-left, 0px)',
      },
      margin: {
        safe: 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
      },
      colors: {
        accent: colors.accent,
        secondary: colors.secondary,
        'bg-primary': colors.bgPrimary,
        'bg-card': colors.bgCard,
        'bg-elevated': colors.bgElevated,
        'text-primary': colors.textPrimary,
        'text-secondary': colors.textSecondary,
        'text-muted': colors.textMuted,
        border: colors.border,
        'border-light': colors.borderLight,
        success: colors.success,
        danger: colors.danger,
        warning: colors.warning,
        info: colors.info,
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
