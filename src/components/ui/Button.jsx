import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';

const VARIANTES = {
  primary: 'bg-primary text-onprimary hover:brightness-110',
  accent: 'bg-accent text-onaccent hover:brightness-110',
  lilac: 'bg-lilac text-onprimary hover:brightness-105',
  secondary: 'bg-surface2 text-ink hover:bg-track',
  outline: 'border border-line bg-transparent text-ink hover:border-primary/50 hover:text-primary',
  ghost: 'text-muted hover:bg-surface2 hover:text-ink',
  glass: 'border border-white/10 bg-black/40 text-white backdrop-blur hover:bg-black/60',
};

const TAMANHOS = {
  xs: 'gap-1.5 rounded-lg px-3 py-1.5 text-xs',
  sm: 'gap-1.5 rounded-lg px-3.5 py-2 text-xs',
  md: 'gap-2 rounded-xl px-4 py-2.5 text-sm',
  lg: 'gap-2 rounded-xl px-5 py-3 text-sm',
};

/**
 * Botão padrão do design system.
 * - `to`   → renderiza <Link> (navegação interna)
 * - `href` → renderiza <a>
 * - caso contrário → <button>
 */
export default function Button({
  variante = 'primary',
  tamanho = 'md',
  to,
  href,
  iconeEsquerda: IconeE,
  iconeDireita: IconeD,
  className,
  children,
  type = 'button',
  ...rest
}) {
  const classes = cn(
    'group inline-flex items-center justify-center whitespace-nowrap font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60',
    VARIANTES[variante],
    TAMANHOS[tamanho],
    className,
  );

  const conteudo = (
    <>
      {IconeE && <IconeE size={tamanho === 'xs' || tamanho === 'sm' ? 14 : 16} aria-hidden />}
      {children}
      {IconeD && (
        <IconeD
          size={tamanho === 'xs' || tamanho === 'sm' ? 14 : 16}
          aria-hidden
          className="transition-transform group-hover:translate-x-0.5"
        />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {conteudo}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {conteudo}
      </a>
    );
  }
  return (
    <button type={type} className={classes} {...rest}>
      {conteudo}
    </button>
  );
}
