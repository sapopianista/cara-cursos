import { useEffect, useId, useRef } from 'react';
import { TriangleAlert, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { usePresenca } from '../../hooks/utilitarios';
import Button from './Button';

const SELETOR_FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Prende o foco do teclado dentro de `containerRef` enquanto `ativo` for verdadeiro,
 * fecha com `Escape`, bloqueia a rolagem do body e devolve o foco ao elemento
 * que estava ativo antes da abertura.
 */
export function useFocusTrap(containerRef, ativo, onFechar) {
  const onFecharRef = useRef(onFechar);
  useEffect(() => {
    onFecharRef.current = onFechar;
  });

  useEffect(() => {
    if (!ativo) return undefined;

    const elementoAnterior = document.activeElement;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const buscarFocaveis = () =>
      containerRef.current
        ? Array.from(containerRef.current.querySelectorAll(SELETOR_FOCAVEIS)).filter(
            (el) => !el.hasAttribute('disabled') && el.getClientRects().length > 0,
          )
        : [];

    const focarPrimeiro = requestAnimationFrame(() => {
      // Prioriza o elemento marcado com data-autofocus (ex.: primeiro campo do formulário).
      const preferido = containerRef.current?.querySelector('[data-autofocus]');
      const alvo = preferido ?? buscarFocaveis()[0] ?? containerRef.current;
      alvo?.focus();
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
      const dentro = containerRef.current?.contains(document.activeElement);

      if (evento.shiftKey && (document.activeElement === primeiro || !dentro)) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && (document.activeElement === ultimo || !dentro)) {
        evento.preventDefault();
        primeiro.focus();
      }
    };

    document.addEventListener('keydown', aoTeclar);
    return () => {
      cancelAnimationFrame(focarPrimeiro);
      document.removeEventListener('keydown', aoTeclar);
      document.body.style.overflow = overflowAnterior;
      if (elementoAnterior && typeof elementoAnterior.focus === 'function') elementoAnterior.focus();
    };
  }, [ativo, containerRef]);
}

const LARGURAS = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

/**
 * Modal acessível (WAI-ARIA dialog) com prisão de foco, Esc/clique no fundo
 * para fechar, retorno de foco ao gatilho e animação de entrada e saída.
 * `rodape` fica fixo embaixo (ações), o conteúdo rola se for longo.
 */
export default function Modal({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  rodape,
  largura = 'md',
  className,
}) {
  const dialogRef = useRef(null);
  const tituloId = useId();
  const descricaoId = useId();
  const { montado, saindo } = usePresenca(aberto);

  useFocusTrap(dialogRef, aberto, onFechar);

  if (!montado) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        onClick={onFechar}
        aria-hidden
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm',
          saindo ? 'animate-fade-out' : 'animate-fade-in',
        )}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        aria-describedby={descricao ? descricaoId : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-line bg-surface text-ink shadow-popover focus:outline-none sm:rounded-2xl',
          LARGURAS[largura],
          saindo ? 'animate-pop-out' : 'animate-pop-in',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-5">
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
          <Button
            variante="ghost"
            tamanho="sm"
            apenasIcone
            onClick={onFechar}
            aria-label="Fechar janela"
            className="-mr-2"
          >
            <X size={18} aria-hidden />
          </Button>
        </div>

        <div className="overflow-y-auto px-6 py-5">{children}</div>

        {rodape && (
          <div className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">
            {rodape}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Confirmação de ação destrutiva/irreversível.
 *   <ConfirmDialog aberto onConfirmar={...} titulo="Desativar Ana?" textoConfirmar="Desativar" perigoso />
 */
export function ConfirmDialog({
  aberto,
  onFechar,
  onConfirmar,
  titulo,
  descricao,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  perigoso = false,
  carregando = false,
  children,
}) {
  return (
    <Modal
      aberto={aberto}
      onFechar={carregando ? () => {} : onFechar}
      titulo={titulo}
      largura="sm"
      rodape={
        <>
          <Button variante="ghost" onClick={onFechar} disabled={carregando}>
            {textoCancelar}
          </Button>
          <Button
            variante={perigoso ? 'danger' : 'primary'}
            onClick={onConfirmar}
            carregando={carregando}
            data-autofocus
          >
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        {perigoso && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-danger/15 text-danger">
            <TriangleAlert size={18} aria-hidden />
          </span>
        )}
        <div className="space-y-3 text-sm text-muted">
          {descricao && <p>{descricao}</p>}
          {children}
        </div>
      </div>
    </Modal>
  );
}
