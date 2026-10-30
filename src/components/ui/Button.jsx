import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn';

const VARIANTES = {
  primary: 'bg-primary text-onprimary hover:bg-primary-hover shadow-sm',
  secondary: 'border border-line bg-surface2 text-ink hover:border-track hover:bg-track/60',
  outline: 'border border-line bg-transparent text-ink hover:border-primary/60 hover:text-primary',
  ghost: 'text-muted hover:bg-surface2 hover:text-ink',
  danger: 'bg-danger text-white hover:bg-danger-hover shadow-sm',
  'danger-ghost': 'text-danger hover:bg-danger/10',
  link: 'text-primary underline-offset-4 hover:underline !px-0 !py-0',
};

const TAMANHOS = {
  sm: 'min-h-9 gap-1.5 rounded-lg px-3 py-1.5 text-sm',
  md: 'min-h-10 gap-2 rounded-xl px-4 py-2 text-sm',
  lg: 'min-h-12 gap-2 rounded-xl px-6 py-3 text-base',
};

const TAMANHO_ICONE = { sm: 15, md: 16, lg: 18 };
const SO_ICONE = { sm: '!px-0 w-9', md: '!px-0 w-10', lg: '!px-0 w-12' };

/**
 * Botão padrão do design system.
 * - `to`   → <Link> (navegação interna)
 * - `href` → <a>
 * - caso contrário → <button>
 * `carregando` desabilita e mostra um spinner (mantendo a largura estável).
 * `apenasIcone` exige `aria-label`.
 */
const Button = forwardRef(function Button(
  {
    variante = 'primary',
    tamanho = 'md',
    to,
    href,
    iconeEsquerda: IconeE,
    iconeDireita: IconeD,
    apenasIcone = false,
    carregando = false,
    blocoInteiro = false,
    className,
    children,
    type = 'button',
    disabled,
    ...rest
  },
  ref,
) {
  const classes = cn(
    'group inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition-[color,background-color,border-color,transform,box-shadow] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55',
    VARIANTES[variante],
    TAMANHOS[tamanho],
    apenasIcone && SO_ICONE[tamanho],
    blocoInteiro && 'w-full',
    className,
  );
  const tamIcone = TAMANHO_ICONE[tamanho];

  const conteudo = (
    <>
      {carregando ? (
        <LoaderCircle size={tamIcone} className="animate-spin" aria-hidden />
      ) : (
        IconeE && <IconeE size={tamIcone} aria-hidden className="shrink-0" />
      )}
      {children}
      {IconeD && !carregando && (
        <IconeD
          size={tamIcone}
          aria-hidden
          className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
        />
      )}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...rest}>
        {conteudo}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {conteudo}
      </a>
    );
  }
  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      {...rest}
    >
      {conteudo}
    </button>
  );
});

export default Button;
