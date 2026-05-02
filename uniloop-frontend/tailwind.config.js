/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        dark: {
          bg:      '#08080f',
          card:    '#10101a',
          surface: '#16162a',
          hover:   '#1e1e35',
          border:  'rgba(255,255,255,0.07)',
        },
        kredit: {
          DEFAULT: '#10b981',
          dark:    '#059669',
          light:   '#34d399',
          glow:    'rgba(16,185,129,0.3)',
        },
        brand: {
          DEFAULT: '#6366f1',
          dark:    '#4f46e5',
          light:   '#818cf8',
          glow:    'rgba(99,102,241,0.4)',
        },
      },
      backgroundImage: {
        'wallet-gradient':  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)',
        'brand-gradient':   'linear-gradient(135deg, #6366f1, #8b5cf6)',
        'kredit-gradient':  'linear-gradient(135deg, #10b981, #059669)',
        'card-glass':       'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
      },
      boxShadow: {
        'glass':    '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        'brand':    '0 0 30px rgba(99,102,241,0.35)',
        'kredit':   '0 0 20px rgba(16,185,129,0.25)',
        'wallet':   '0 20px 60px rgba(79,70,229,0.4)',
      },
      animation: {
        'shimmer':      'shimmer 2.5s linear infinite',
        'fade-up':      'fadeUp 0.4s ease-out',
        'fade-in':      'fadeIn 0.3s ease-out',
        'pulse-soft':   'pulseSoft 2s ease-in-out infinite',
        'slide-up':     'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
