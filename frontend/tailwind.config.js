/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  'rgb(var(--primary-50) / <alpha-value>)',
          100: 'rgb(var(--primary-100) / <alpha-value>)',
          200: 'rgb(var(--primary-200) / <alpha-value>)',
          400: 'rgb(var(--primary-400) / <alpha-value>)',
          500: 'rgb(var(--primary-500) / <alpha-value>)',
          600: 'rgb(var(--primary-600) / <alpha-value>)',
          700: 'rgb(var(--primary-700) / <alpha-value>)',
          800: 'rgb(var(--primary-800) / <alpha-value>)',
          900: 'rgb(var(--primary-900) / <alpha-value>)',
          950: 'rgb(var(--primary-950) / <alpha-value>)',
        },
        accent: {
          300: 'rgb(var(--accent-300) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
        },
        bg: {
          base:    'rgb(var(--bg-base) / <alpha-value>)',
          surface: 'rgb(var(--bg-surface) / <alpha-value>)',
          card:    'rgb(var(--bg-card) / <alpha-value>)',
          border:  'rgb(var(--bg-border) / <alpha-value>)',
          hover:   'rgb(var(--bg-hover) / <alpha-value>)',
        },
        content: {
          primary:   'rgb(var(--content-primary) / <alpha-value>)',
          secondary: 'rgb(var(--content-secondary) / <alpha-value>)',
          muted:     'rgb(var(--content-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'sans-serif'],
        head:  ['Outfit', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow:        '0 0 20px rgb(var(--primary-500) / 0.25)',
        'glow-lg':   '0 0 40px rgb(var(--primary-500) / 0.35)',
        'glow-teal': '0 0 20px rgb(var(--accent-500) / 0.25)',
        card:        '0 4px 24px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
