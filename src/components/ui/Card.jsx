import { cn } from '../../lib/cn';

const ESPACAMENTO = { nenhum: '', sm: 'p-4', md: 'p-5', lg: 'p-6 sm:p-8' };

/**
 * Container base (superfície) usado por todos os painéis.
 * `interativo` aplica hover/pressionado — use quando o card inteiro é clicável.
 */
export default function Card({
  as: Tag = 'div',
  espacamento = 'md',
  interativo = false,
  className,
  children,
  ...rest
}) {
  return (
    <Tag
      className={cn(
        'rounded-2xl border border-line bg-surface shadow-card',
        ESPACAMENTO[espacamento],
        interativo && 'card-interativo',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
