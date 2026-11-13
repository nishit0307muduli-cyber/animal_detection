/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030712',
          900: '#070d1e',
          850: '#0c152e',
          800: '#111d3d',
          750: '#16244c',
          700: '#1c2d5d',
          600: '#253b75',
          500: '#344f99',
        },
        rail: {
          500: '#3b82f6',
          400: '#60a5fa',
          300: '#93c5fd',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
        },
        alert: {
          600: '#dc2626',
          500: '#ef4444',
          400: '#f87171',
          300: '#fca5a5',
        },
        warn: {
          500: '#f59e0b',
          400: '#fbbf24',
          300: '#fcd34d',
        },
        safe: {
          500: '#10b981',
          400: '#34d399',
          300: '#6ee7b7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.35s ease-out',
        'radar-spin': 'radarSpin 4s linear infinite',
        'scan': 'scanLine 2.5s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        radarSpin: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        scanLine: {
          '0%': { top: '0%' },
          '50%': { top: '95%' },
          '100%': { top: '0%' },
        },
        glowPulse: {
          from: { boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)' },
          to: { boxShadow: '0 0 25px rgba(59, 130, 246, 0.6)' },
        },
      },
      boxShadow: {
        'glow-blue': '0 0 20px -3px rgba(59, 130, 246, 0.4)',
        'glow-cyan': '0 0 20px -3px rgba(34, 211, 238, 0.4)',
        'glow-red': '0 0 25px -3px rgba(239, 68, 68, 0.5)',
        'glow-green': '0 0 20px -3px rgba(16, 185, 129, 0.4)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
}
