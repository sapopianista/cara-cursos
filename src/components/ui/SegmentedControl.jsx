import { cn } from '../../lib/cn';

/**
 * Grupo de botões com seleção única.
 * - variante "pill"  → trilho com item ativo destacado (períodos: 7 dias | 30 dias…)
 * - variante "chips" → chips separados (filtros por categoria/status)
 *
 * opcoes: [{ valor, rotulo, contador? }]
 */
export default function SegmentedControl({ opcoes, valor, onChange, variante = 'pill', rotulo, className }) {
  const pill = variante === 'pill';

  return (
    <div
      role="group"
      aria-label={rotulo}
      className={cn(
        pill
          ? 'inline-flex max-w-full overflow-x-auto rounded-xl border border-line bg-surface p-1'
          : // Celular: uma linha com rolagem lateral (não empurra o conteúdo para baixo).
            '-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0',
        className,
      )}
    >
      {opcoes.map(({ valor: v, rotulo: r, contador }) => {
        const ativo = v === valor;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(v)}
            className={cn(
              'inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-150',
              pill && (ativo ? 'bg-surface2 text-ink shadow-sm' : 'text-muted hover:text-ink'),
              !pill &&
                (ativo
                  ? 'bg-primary text-onprimary'
                  : 'border border-line bg-surface text-muted hover:border-track hover:text-ink'),
            )}
          >
            {r}
            {contador != null && (
              <span
                className={cn(
                  'rounded-full px-1.5 text-xs tabular-nums',
                  ativo ? (pill ? 'bg-track text-ink' : 'bg-onprimary/15') : 'bg-surface2 text-muted',
                )}
              >
                {contador}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
