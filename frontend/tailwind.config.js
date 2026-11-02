/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { 900: '#060d1f', 800: '#0b1529', 700: '#111f3a', 600: '#172849' },
        rail:  { 500: '#3b7be8', 400: '#5c9af5', 300: '#8ab8ff' },
        alert: { 500: '#ef4444', 400: '#f87171', 300: '#fca5a5' },
        warn:  { 500: '#f59e0b', 400: '#fbbf24' },
        safe:  { 500: '#10b981', 400: '#34d399' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'slide-up':   'slideUp 0.3s ease-out',
        'fade-in':    'fadeIn 0.4s ease-out',
      },
      keyframes: {
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
      },
    },
  },
  plugins: [],
}
