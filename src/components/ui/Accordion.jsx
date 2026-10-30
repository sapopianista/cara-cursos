import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Lista de perguntas/respostas expansíveis (padrão WAI-ARIA accordion),
 * com transição de altura e seta que gira.
 * itens: [{ id, titulo, conteudo }]
 */
export default function Accordion({ itens, nivelTitulo = 3, abertoInicial = null, className }) {
  const [abertoId, setAbertoId] = useState(abertoInicial);
  const base = useId();
  const Titulo = `h${nivelTitulo}`;

  return (
    <div
      className={cn(
        'divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface',
        className,
      )}
    >
      {itens.map((item) => {
        const aberto = abertoId === item.id;
        const idBotao = `${base}-b-${item.id}`;
        const idPainel = `${base}-p-${item.id}`;
        return (
          <div key={item.id}>
            <Titulo className="m-0">
              <button
                id={idBotao}
                type="button"
                aria-expanded={aberto}
                aria-controls={idPainel}
                onClick={() => setAbertoId(aberto ? null : item.id)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold text-ink transition-colors hover:bg-surface2/60"
              >
                <span>{item.titulo}</span>
                <ChevronDown
                  size={18}
                  aria-hidden
                  className={cn(
                    'shrink-0 text-muted transition-transform duration-300 ease-suave',
                    aberto && 'rotate-180',
                  )}
                />
              </button>
            </Titulo>
            <div
              id={idPainel}
              role="region"
              aria-labelledby={idBotao}
              data-aberto={aberto}
              className="recolhivel"
              inert={aberto ? undefined : true}
            >
              <div>
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted">{item.conteudo}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
