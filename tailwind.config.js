/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
        secondary: '#E8C99A',
        'bg-primary': '#0F0F0F',
        'bg-card': '#1A1A1A',
        'bg-elevated': '#242424',
        'text-primary': '#F5F5F5',
        'text-secondary': '#A3A3A3',
        border: '#2A2A2A',
        success: '#22C55E',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
