/**
 * Design system "Cara Cursos".
 * As cores vêm de CSS variables (definidas em src/index.css) para que o
 * botão "Modo escuro" alterne o tema sem duplicar classes nos componentes.
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
        primary: cor('primary'),
        accent: cor('accent'),
        warn: cor('warn'),
        danger: cor('danger'),
        lilac: cor('lilac'),
        onprimary: cor('on-primary'),
        onaccent: cor('on-accent'),
      },
      boxShadow: {
        card: '0 1px 0 0 rgb(255 255 255 / 0.03) inset, 0 8px 24px -12px rgb(0 0 0 / 0.5)',
        glow: '0 0 0 6px rgb(var(--c-primary) / 0.18), 0 10px 30px -6px rgb(var(--c-primary) / 0.6)',
      },
    },
  },
  plugins: [],
};
