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
          bg: '#f8fafc',      // slate-50
          card: '#ffffff',    // pure white
          surface: '#f1f5f9', // slate-100
          hover: '#f1f5f9',   // slate-100
          border: '#e2e8f0',  // slate-200
        },
        kredit: {
          DEFAULT: '#059669', // emerald-600
          dark: '#047857',    // emerald-700
          light: '#10b981',   // emerald-500
          glow: 'rgba(5, 150, 105, 0.1)',
        },
        brand: {
          DEFAULT: '#0f172a', // slate-900
          dark: '#020617',    // slate-950
          light: '#1e293b',   // slate-800
          glow: 'rgba(15, 23, 42, 0.1)',
        },
      },
      backgroundImage: {
        // Gradientleri dümdüz tok renklere çeviriyoruz (fintech stili)
        'wallet-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'brand-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        'kredit-gradient': 'linear-gradient(135deg, #059669 0%, #047857 100%)',
        'card-glass': 'none',
      },
      boxShadow: {
        // Hafif, temiz ve profesyonel gölgeler
        'glass': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'brand': '0 4px 6px -1px rgba(15, 23, 42, 0.1)',
        'kredit': '0 4px 6px -1px rgba(5, 150, 105, 0.1)',
        'wallet': '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'shimmer': 'shimmer 2.5s linear infinite',
        'fade-up': 'fadeUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
