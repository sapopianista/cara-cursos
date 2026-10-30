import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Gera [1, 2, 3, '…', 15] mantendo vizinhos da página atual visíveis. */
export function paginasVisiveis(atual, total) {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, atual - 1, atual, atual + 1]);
  if (atual <= 3) [2, 3].forEach((p) => set.add(p));
  if (atual >= total - 2) [total - 1, total - 2].forEach((p) => set.add(p));

  const ordenadas = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const saida = [];
  ordenadas.forEach((p, i) => {
    if (i > 0 && p - ordenadas[i - 1] > 1) saida.push('…');
    saida.push(p);
  });
  return saida;
}

/** Paginação com resumo "11–20 de 24". */
export default function Pagination({ pagina, totalPaginas, total, porPagina, onChange, className }) {
  if (totalPaginas <= 1) return null;
  const base =
    'grid h-9 min-w-9 place-items-center rounded-lg px-2.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40';
  const inicio = (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, total);

  return (
    <div className={cn('flex flex-col items-center justify-between gap-3 sm:flex-row', className)}>
      {total != null && (
        <p className="text-sm text-muted" aria-live="polite">
          {inicio}–{fim} de {total}
        </p>
      )}
      <nav aria-label="Paginação" className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onChange(pagina - 1)}
          disabled={pagina === 1}
          className={cn(base, 'bg-surface2 text-muted hover:bg-track hover:text-ink')}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>

        {paginasVisiveis(pagina, totalPaginas).map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1 text-sm text-subtle" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === pagina ? 'page' : undefined}
              aria-label={`Página ${p}`}
              className={cn(
                base,
                p === pagina
                  ? 'bg-primary text-onprimary'
                  : 'bg-surface2 text-muted hover:bg-track hover:text-ink',
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onChange(pagina + 1)}
          disabled={pagina === totalPaginas}
          className={cn(base, 'bg-surface2 text-muted hover:bg-track hover:text-ink')}
          aria-label="Próxima página"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </nav>
    </div>
  );
}
