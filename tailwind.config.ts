import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#101214',
          panel: '#171a1f',
          panelSoft: '#1f232b',
          line: '#2d333d',
          text: '#f4f7fb',
          muted: '#9ba7b5',
          accent: '#55b8ff',
          success: '#39d98a',
          warning: '#f4bf50',
          danger: '#ff6b6b',
        },
      },
      boxShadow: {
        soft: '0 18px 60px rgba(0, 0, 0, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
