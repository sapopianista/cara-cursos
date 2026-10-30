import { useId } from 'react';
import { cn } from '../../lib/cn';

/**
 * Interruptor liga/desliga (role="switch"). O texto inteiro é clicável.
 *   <Switch rotulo="Emissão automática" descricao="..." ativo={x} onChange={setX} />
 */
export default function Switch({
  rotulo,
  descricao,
  ativo,
  onChange,
  rotuloOculto = false,
  className,
  disabled,
}) {
  const id = useId();
  return (
    <div className={cn('flex items-center justify-between gap-6', className)}>
      {!rotuloOculto && (
        <label htmlFor={id} className="min-w-0 cursor-pointer">
          <span className="block text-sm font-semibold text-ink">{rotulo}</span>
          {descricao && (
            <span id={`${id}-d`} className="mt-0.5 block text-sm text-muted">
              {descricao}
            </span>
          )}
        </label>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={ativo}
        aria-label={rotuloOculto ? rotulo : undefined}
        aria-describedby={descricao && !rotuloOculto ? `${id}-d` : undefined}
        disabled={disabled}
        onClick={() => onChange(!ativo)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 disabled:opacity-50',
          ativo ? 'border-primary bg-primary' : 'border-line bg-track',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-200 ease-suave',
            ativo ? 'translate-x-[22px]' : 'translate-x-[3px]',
          )}
        />
      </button>
    </div>
  );
}
