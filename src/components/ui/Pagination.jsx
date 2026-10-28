import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Gera [1, 2, 3, '…', 15] mantendo vizinhos da página atual visíveis. */
function paginasVisiveis(atual, total) {
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

/** Paginação. `compacto` mostra só setas nos botões anterior/próximo. */
export default function Pagination({ pagina, totalPaginas, onChange, compacto = false }) {
  if (totalPaginas <= 1) return null;
  const botaoBase =
    'grid h-9 min-w-9 place-items-center rounded-lg px-2.5 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-40';

  return (
    <nav aria-label="Paginação" className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(pagina - 1)}
        disabled={pagina === 1}
        className={cn(botaoBase, 'bg-surface2 text-muted hover:bg-track hover:text-ink')}
        aria-label="Página anterior"
      >
        {compacto ? (
          <ChevronLeft size={15} />
        ) : (
          <span className="flex items-center gap-1">
            <ChevronLeft size={13} /> Anterior
          </span>
        )}
      </button>

      {paginasVisiveis(pagina, totalPaginas).map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} className="px-1 text-xs text-subtle">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === pagina ? 'page' : undefined}
            className={cn(
              botaoBase,
              p === pagina ? 'bg-primary text-onprimary' : 'bg-surface2 text-muted hover:bg-track hover:text-ink',
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
        className={cn(botaoBase, 'bg-surface2 text-ink hover:bg-track')}
        aria-label="Próxima página"
      >
        {compacto ? (
          <ChevronRight size={15} />
        ) : (
          <span className="flex items-center gap-1">
            Próximo <ChevronRight size={13} />
          </span>
        )}
      </button>
    </nav>
  );
}
