import { useRef } from 'react';
import { cn } from '../../lib/cn';

/**
 * Abas com sublinhado (padrão WAI-ARIA tabs, navegação por setas).
 * abas: [{ id, rotulo, contador? }]
 */
export default function Tabs({ abas, ativa, onChange, idBase = 'aba', className }) {
  const refs = useRef([]);

  const aoTeclar = (e, indice) => {
    const delta = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const proximo = (indice + delta + abas.length) % abas.length;
    onChange(abas[proximo].id);
    refs.current[proximo]?.focus();
  };

  return (
    <div role="tablist" className={cn('flex gap-6 overflow-x-auto border-b border-line', className)}>
      {abas.map((aba, i) => {
        const selecionada = aba.id === ativa;
        return (
          <button
            key={aba.id}
            ref={(el) => (refs.current[i] = el)}
            role="tab"
            type="button"
            id={`${idBase}-${aba.id}`}
            aria-selected={selecionada}
            aria-controls={`${idBase}-painel-${aba.id}`}
            tabIndex={selecionada ? 0 : -1}
            onClick={() => onChange(aba.id)}
            onKeyDown={(e) => aoTeclar(e, i)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 pb-3 text-sm font-medium uppercase tracking-wide transition-colors',
              selecionada ? 'text-primary' : 'text-muted hover:text-ink',
            )}
          >
            {aba.rotulo}
            {aba.contador != null && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-onprimary">
                {aba.contador}
              </span>
            )}
            <span
              aria-hidden
              className={cn(
                'absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary transition-transform duration-300',
                selecionada ? 'scale-x-100' : 'scale-x-0',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/** Painel associado a uma aba. */
export function TabPanel({ id, ativa, idBase = 'aba', children }) {
  if (id !== ativa) return null;
  return (
    <div role="tabpanel" id={`${idBase}-painel-${id}`} aria-labelledby={`${idBase}-${id}`} className="animate-entrada">
      {children}
    </div>
  );
}
