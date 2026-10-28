import { cn } from '../../lib/cn';

/**
 * Grupo de botões de filtro com seleção única.
 * - variante "pill"  → trilho escuro com item ativo destacado (Todos | Mais recentes...)
 * - variante "chips" → chips separados, ativo em lilás (catálogo)
 *
 * opcoes: [{ valor, rotulo, icone? }]
 */
export default function SegmentedControl({ opcoes, valor, onChange, variante = 'pill', rotulo, className }) {
  const pill = variante === 'pill';

  return (
    <div
      role="group"
      aria-label={rotulo}
      className={cn(pill ? 'inline-flex rounded-xl border border-line bg-surface p-1' : 'flex flex-wrap gap-2', className)}
    >
      {opcoes.map(({ valor: v, rotulo: r, icone: Icone }) => {
        const ativo = v === valor;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={ativo}
            onClick={() => onChange(v)}
            className={cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium transition-colors',
              pill ? 'rounded-lg px-3 py-1.5' : 'rounded-lg px-3 py-1.5',
              pill &&
                (ativo ? 'bg-surface2 text-ink shadow-sm' : 'text-muted hover:text-ink'),
              !pill &&
                (ativo
                  ? 'bg-lilac text-onprimary'
                  : 'border border-line bg-surface2/60 text-muted hover:border-track hover:text-ink'),
            )}
          >
            {Icone && <Icone size={13} aria-hidden className={!ativo && !pill ? 'text-accent' : ''} />}
            {r}
          </button>
        );
      })}
    </div>
  );
}
