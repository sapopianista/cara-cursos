import { useEffect, useId, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/cn';
import { usePopover } from '../../hooks/utilitarios';

/**
 * Menu de ações de uma linha (padrão WAI-ARIA menu button).
 * Setas ↑/↓ navegam, Enter/Espaço executam, Esc fecha.
 *
 * acoes: [{ rotulo, icone?, onClick, perigoso?, oculto? }]
 */
export default function MenuAcoes({ acoes, rotulo = 'Ações' }) {
  const { aberto, setAberto, containerRef, gatilhoRef } = usePopover();
  const menuId = useId();
  const itensRef = useRef([]);
  const visiveis = acoes.filter((a) => !a.oculto);

  useEffect(() => {
    if (aberto) requestAnimationFrame(() => itensRef.current[0]?.focus());
  }, [aberto]);

  const aoTeclar = (e, i) => {
    const mover = { ArrowDown: 1, ArrowUp: -1 }[e.key];
    if (mover) {
      e.preventDefault();
      itensRef.current[(i + mover + visiveis.length) % visiveis.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      itensRef.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      itensRef.current[visiveis.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      setAberto(false);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        ref={gatilhoRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? menuId : undefined}
        aria-label={rotulo}
        onClick={() => setAberto((v) => !v)}
        onKeyDown={(e) => e.key === 'ArrowDown' && (e.preventDefault(), setAberto(true))}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-ink"
      >
        <MoreHorizontal size={18} aria-hidden />
      </button>

      {aberto && (
        <ul
          id={menuId}
          role="menu"
          aria-label={rotulo}
          className="absolute right-0 top-full z-30 mt-1 w-56 animate-pop-in rounded-xl border border-line bg-surface p-1.5 shadow-popover"
        >
          {visiveis.map((acao, i) => {
            const Icone = acao.icone;
            return (
              <li key={acao.rotulo} role="none">
                <button
                  ref={(el) => (itensRef.current[i] = el)}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  onKeyDown={(e) => aoTeclar(e, i)}
                  onClick={() => {
                    setAberto(false);
                    gatilhoRef.current?.focus();
                    acao.onClick();
                  }}
                  className={cn(
                    'flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none',
                    acao.perigoso
                      ? 'text-danger hover:bg-danger/10 focus:bg-danger/10'
                      : 'text-ink hover:bg-surface2 focus:bg-surface2',
                  )}
                >
                  {Icone && <Icone size={16} aria-hidden className="shrink-0" />}
                  {acao.rotulo}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
