/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#F8F8F8',
          100: '#F0F0F0',
          200: '#E0E0E0',
          300: '#C0C0C0',
          400: '#909090',
          500: '#606060',
          600: '#383838',
          700: '#222222',
          800: '#111111',
          900: '#050505',
        },
        primary: {
          DEFAULT: '#111111',
          50:  '#F8F8F8',
          100: '#F0F0F0',
          200: '#E0E0E0',
          300: '#C0C0C0',
          400: '#909090',
          500: '#606060',
          600: '#383838',
          700: '#222222',
          800: '#111111',
          900: '#050505',
        },
        ink: {
          DEFAULT: '#0C0C0C',
          soft:    '#2A2A2A',
          muted:   '#6A6A6A',
          faint:   '#9A9A9A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          page:    '#F6F6F6',
          subtle:  '#F2F2F2',
          raised:  '#EEEEEE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },
      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        lifted: '0 4px 16px rgba(0,0,0,0.09), 0 2px 4px rgba(0,0,0,0.04)',
        focus:  '0 0 0 3px rgba(0,0,0,0.15)',
        glow:   '0 0 20px rgba(0,0,0,0.18)',
        header: '0 2px 12px rgba(0,0,0,0.25)',
        float:  '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        inner:  'inset 0 1px 3px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backgroundImage: {
        'header-gradient':    'linear-gradient(135deg, #000000 0%, #1A1A1A 100%)',
        'header-gradient-sm': 'linear-gradient(135deg, #111111 0%, #2A2A2A 100%)',
        'brand-gradient':     'linear-gradient(135deg, #111111 0%, #333333 100%)',
        'card-highlight':     'linear-gradient(135deg, #F8F8F8 0%, #F0F0F0 100%)',
        'success-gradient':   'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0', transform: 'translateY(6px)' },  to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pop:     { '0%': { transform: 'scale(0.96)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        pulse2:  { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out both',
        'slide-up': 'slideUp 0.25s ease-out both',
        'pop':      'pop 0.15s ease-out both',
        'pulse2':   'pulse2 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
