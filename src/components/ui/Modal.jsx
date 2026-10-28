import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

const SELETOR_FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Prende o foco do teclado dentro de `containerRef` enquanto `ativo` for verdadeiro,
 * fecha com `Escape`, bloqueia a rolagem do body e devolve o foco ao elemento
 * que estava ativo antes da abertura.
 */
export function useFocusTrap(containerRef, ativo, onFechar) {
  const onFecharRef = useRef(onFechar);
  onFecharRef.current = onFechar;

  useEffect(() => {
    if (!ativo) return undefined;

    const elementoAnterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const buscarFocaveis = () => {
      if (!containerRef.current) return [];
      return Array.from(containerRef.current.querySelectorAll(SELETOR_FOCAVEIS)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      );
    };

    const focarPrimeiro = requestAnimationFrame(() => {
      const focaveis = buscarFocaveis();
      if (focaveis.length > 0) {
        focaveis[0].focus();
      } else {
        containerRef.current?.focus();
      }
    });

    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') {
        evento.stopPropagation();
        onFecharRef.current?.();
        return;
      }

      if (evento.key !== 'Tab') return;

      const focaveis = buscarFocaveis();
      if (focaveis.length === 0) {
        evento.preventDefault();
        return;
      }

      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];

      if (evento.shiftKey) {
        if (document.activeElement === primeiro || !containerRef.current?.contains(document.activeElement)) {
          evento.preventDefault();
          ultimo.focus();
        }
      } else if (document.activeElement === ultimo || !containerRef.current?.contains(document.activeElement)) {
        evento.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener('keydown', aoTeclar);

    return () => {
      cancelAnimationFrame(focarPrimeiro);
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
      if (elementoAnterior && typeof elementoAnterior.focus === 'function') {
        elementoAnterior.focus();
      }
    };
  }, [ativo, containerRef]);
}

/**
 * Componente de Modal acessível (WAI-ARIA dialog) com prisão de foco,
 * fechamento por Esc/clique no fundo e retorno de foco ao gatilho.
 */
export default function Modal({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  className,
}) {
  const dialogRef = useRef(null);
  const tituloId = useId();
  const descricaoId = useId();

  useFocusTrap(dialogRef, aberto, onFechar);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onFechar}
        aria-hidden
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descricao ? descricaoId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-2xl border border-line bg-surface p-6 text-ink shadow-xl focus:outline-none',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 id={tituloId} className="text-lg font-semibold text-ink">
              {titulo}
            </h2>
            {descricao && (
              <p id={descricaoId} className="mt-1 text-sm text-muted">
                {descricao}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar janela"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-ink"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
