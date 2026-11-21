import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f7f8f5',
        surface: '#ffffff',
        'surface-elevated': '#f2f4ef',
        border: '#e4e7e1',
        primary: {
          DEFAULT: '#1d5a43',
          hover: '#174936',
          glow: '#3c8064',
        },
        accent: {
          DEFAULT: '#10b981',
          glow: '#34d399',
        },
        warning: {
          DEFAULT: '#f59e0b',
          glow: '#fbbf24',
        },
        danger: {
          DEFAULT: '#ef4444',
          glow: '#f87171',
        },
      },
      boxShadow: {
        'glow-primary': '0 0 20px -5px rgba(99, 102, 241, 0.3)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.3)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.3)',
      },
    },
  },
  plugins: [],
};
export default config;
