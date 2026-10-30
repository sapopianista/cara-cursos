import { cn } from '../../lib/cn';

const TONS = {
  sucesso: 'bg-accent/15 text-accent',
  alerta: 'bg-warn/15 text-warn',
  erro: 'bg-danger/15 text-danger',
  info: 'bg-primary/15 text-primary',
  neutro: 'bg-surface2 text-muted',
};

/** Etiqueta curta de status/categoria. O texto sempre comunica o estado (não só a cor). */
export default function Badge({ tom = 'neutro', icone: Icone, children, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',
        TONS[tom],
        className,
      )}
    >
      {Icone && <Icone size={13} aria-hidden />}
      {children}
    </span>
  );
}

/**
 * Badge a partir de um mapa de status (ver lib/rotulos.js).
 *   <StatusBadge mapa={STATUS_COLABORADOR} valor="ativo" />
 */
export function StatusBadge({ mapa, valor, className }) {
  const item = mapa[valor] ?? { rotulo: valor, tom: 'neutro' };
  return (
    <Badge tom={item.tom} icone={item.icone} className={className}>
      {item.rotulo}
    </Badge>
  );
}
