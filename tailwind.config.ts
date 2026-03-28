import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0D0D1A',
        'bg-card': '#13132B',
        'bg-panel': '#1A1A35',
        purple: '#6C63FF',
        pink: '#FF6584',
        green: '#43D19E',
        yellow: '#FFD166',
        cyan: '#00F5FF',
        'text-primary': '#EAEAEA',
        'text-muted': '#7B7B9D',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        inter: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 2s ease-in-out infinite',
        'happy': 'happy 0.4s ease-in-out 3',
        'sad': 'sad 0.3s ease-in-out 2',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        happy: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        sad: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-6px)' },
          '75%': { transform: 'translateX(6px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
