import { forwardRef, useId } from 'react';
import { ChevronDown, CircleAlert } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Estilo base compartilhado por input, select e textarea. */
export const classeControle = (erro, extra) =>
  cn(
    'w-full rounded-xl border bg-surface2 px-3.5 py-2.5 text-sm text-ink placeholder:text-subtle transition-colors',
    'hover:border-track focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
    erro ? 'border-danger/70 focus:border-danger' : 'border-line',
    extra,
  );

/**
 * Envoltório de campo: rótulo + controle + dica + mensagem de erro, com os
 * atributos ARIA ligados (aria-describedby / aria-invalid).
 *
 *   <Campo rotulo="E-mail" erro={erros.email} obrigatorio>
 *     {(props) => <input {...props} type="email" />}
 *   </Campo>
 */
export function Campo({
  rotulo,
  dica,
  erro,
  obrigatorio = false,
  rotuloOculto = false,
  className,
  children,
}) {
  const id = useId();
  const idDica = `${id}-dica`;
  const idErro = `${id}-erro`;
  const descricao = [dica && idDica, erro && idErro].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={rotuloOculto ? 'sr-only' : 'mb-1.5 block text-sm font-medium text-ink'}>
        {rotulo}
        {obrigatorio && (
          <span className="text-danger" aria-hidden>
            {' '}
            *
          </span>
        )}
        {!obrigatorio && !rotuloOculto && <span className="font-normal text-subtle"> (opcional)</span>}
      </label>
      {children({
        id,
        'aria-describedby': descricao,
        'aria-invalid': erro ? true : undefined,
        required: obrigatorio,
      })}
      {dica && !erro && (
        <p id={idDica} className="mt-1.5 text-xs text-muted">
          {dica}
        </p>
      )}
      {erro && (
        <p id={idErro} className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-danger">
          <CircleAlert size={13} aria-hidden className="shrink-0" />
          {erro}
        </p>
      )}
    </div>
  );
}

export const CampoTexto = forwardRef(function CampoTexto(
  { rotulo, dica, erro, obrigatorio, rotuloOculto, className, icone: Icone, inputClassName, ...rest },
  ref,
) {
  return (
    <Campo
      rotulo={rotulo}
      dica={dica}
      erro={erro}
      obrigatorio={obrigatorio}
      rotuloOculto={rotuloOculto}
      className={className}
    >
      {(props) => (
        <div className="relative">
          {Icone && (
            <Icone
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle"
            />
          )}
          <input
            ref={ref}
            {...props}
            {...rest}
            className={classeControle(erro, cn(Icone && 'pl-10', inputClassName))}
          />
        </div>
      )}
    </Campo>
  );
});

export function CampoArea({ rotulo, dica, erro, obrigatorio, className, rows = 4, ...rest }) {
  return (
    <Campo rotulo={rotulo} dica={dica} erro={erro} obrigatorio={obrigatorio} className={className}>
      {(props) => <textarea {...props} {...rest} rows={rows} className={classeControle(erro, 'resize-y')} />}
    </Campo>
  );
}

/** Select nativo (acessível e com bom comportamento no mobile). opcoes: [{ valor, rotulo }] */
export function CampoSelecao({
  rotulo,
  dica,
  erro,
  obrigatorio,
  rotuloOculto,
  className,
  opcoes,
  placeholder,
  ...rest
}) {
  return (
    <Campo
      rotulo={rotulo}
      dica={dica}
      erro={erro}
      obrigatorio={obrigatorio}
      rotuloOculto={rotuloOculto}
      className={className}
    >
      {(props) => (
        <div className="relative">
          <select
            {...props}
            {...rest}
            className={classeControle(erro, 'cursor-pointer appearance-none pr-10')}
          >
            {placeholder && (
              <option value="" disabled={obrigatorio}>
                {placeholder}
              </option>
            )}
            {opcoes.map((o) => (
              <option key={o.valor} value={o.valor} className="bg-surface">
                {o.rotulo}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            aria-hidden
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
        </div>
      )}
    </Campo>
  );
}

export function Checkbox({ rotulo, descricao, className, ...rest }) {
  const id = useId();
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line accent-[rgb(var(--c-primary))]"
        aria-describedby={descricao ? `${id}-d` : undefined}
        {...rest}
      />
      <label htmlFor={id} className="cursor-pointer text-sm text-ink">
        {rotulo}
        {descricao && (
          <span id={`${id}-d`} className="mt-0.5 block text-xs text-muted">
            {descricao}
          </span>
        )}
      </label>
    </div>
  );
}
