import { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Select nativo estilizado (acessível e compatível com mobile).
 * opcoes: [{ valor, rotulo }]
 */
export default function Select({ rotulo, rotuloVisivel = false, icone: Icone, valor, onChange, opcoes, className, ...rest }) {
  const id = useId();

  return (
    <div className={cn('relative', className)}>
      <label htmlFor={id} className={rotuloVisivel ? 'mb-1.5 block text-xs font-medium text-muted' : 'sr-only'}>
        {rotulo}
      </label>
      <div className="relative">
        {Icone && (
          <Icone size={15} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-warn" />
        )}
        <select
          id={id}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full cursor-pointer appearance-none rounded-xl border border-line bg-surface2/70 py-2.5 pr-9 text-xs font-medium text-ink transition-colors hover:border-track focus:border-primary/60 focus:outline-none',
            Icone ? 'pl-9' : 'pl-3.5',
          )}
          {...rest}
        >
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor} className="bg-surface">
              {o.rotulo}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
    </div>
  );
}
