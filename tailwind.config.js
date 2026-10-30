/**
 * Design system "Cara Cursos".
 * As cores vêm de CSS variables (definidas em src/index.css) para que o
 * interruptor de tema alterne dark/light sem duplicar classes nos componentes.
 * O formato `rgb(var(--x) / <alpha-value>)` mantém suporte a `bg-primary/10`.
 */
const cor = (nome) => `rgb(var(--c-${nome}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: cor('bg'),
        sidebar: cor('sidebar'),
        surface: cor('surface'),
        surface2: cor('surface-2'),
        line: cor('line'),
        track: cor('track'),
        ink: cor('ink'),
        muted: cor('muted'),
        subtle: cor('subtle'),
        primary: { DEFAULT: cor('primary'), hover: cor('primary-hover') },
        accent: cor('accent'),
        warn: cor('warn'),
        danger: { DEFAULT: cor('danger'), hover: cor('danger-hover') },
        lilac: cor('lilac'),
        onprimary: cor('on-primary'),
        onaccent: cor('on-accent'),
        player: cor('player'),
      },
      maxWidth: {
        pagina: '72rem',
      },
      boxShadow: {
        card: '0 1px 0 0 rgb(255 255 255 / 0.03) inset, 0 8px 24px -12px rgb(0 0 0 / 0.5)',
        'card-hover': '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 16px 32px -14px rgb(0 0 0 / 0.55)',
        glow: '0 0 0 6px rgb(var(--c-primary) / 0.18), 0 10px 30px -6px rgb(var(--c-primary) / 0.6)',
        popover: '0 12px 32px -8px rgb(0 0 0 / 0.45)',
      },
      transitionTimingFunction: {
        suave: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        entrada: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'fade-out': { from: { opacity: 1 }, to: { opacity: 0 } },
        'pop-in': {
          from: { opacity: 0, transform: 'translateY(6px) scale(0.98)' },
          to: { opacity: 1, transform: 'none' },
        },
        'pop-out': {
          from: { opacity: 1, transform: 'none' },
          to: { opacity: 0, transform: 'translateY(6px) scale(0.98)' },
        },
        'toast-in': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
      },
      animation: {
        entrada: 'entrada 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.2s ease-out both',
        'fade-out': 'fade-out 0.15s ease-in both',
        'pop-in': 'pop-in 0.22s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-out': 'pop-out 0.15s ease-in both',
        'toast-in': 'toast-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
