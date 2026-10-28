import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useFocusTrap } from '../ui/Modal';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

/**
 * Menu lateral. Fixo no desktop (lg+), gaveta deslizante com foco preso no mobile.
 * `menu` vem de src/config/navigation.js.
 * Quando a gaveta está fechada no mobile, fica `invisible` (fora da ordem de
 * tabulação e da árvore de acessibilidade). Quando aberta, prende o foco (`Tab` /
 * `Shift+Tab`), fecha com `Esc` e devolve o foco ao botão que a abriu.
 */
export default function Sidebar({ menu, aberta, onFechar }) {
  const gavetaRef = useRef(null);

  useFocusTrap(gavetaRef, aberta, onFechar);

  return (
    <>
      {/* Overlay (mobile) — clique fora fecha; teclado fecha com Esc via useFocusTrap */}
      <div
        onClick={onFechar}
        aria-hidden
        className={cn(
          'fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          aberta ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <div
        ref={gavetaRef}
        role={aberta ? 'dialog' : undefined}
        aria-modal={aberta ? 'true' : undefined}
        aria-label={aberta ? 'Menu de navegação' : undefined}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-sidebar px-4 pb-5 pt-6 transition-[transform,visibility] duration-300 lg:visible lg:w-56 lg:translate-x-0',
          aberta ? 'translate-x-0' : '-translate-x-full max-lg:invisible',
        )}
      >
        <div className="flex items-center justify-between px-2">
          <Logo />
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar menu"
            className="rounded-lg p-2 text-muted hover:bg-surface hover:text-ink lg:hidden"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <nav aria-label="Menu principal" className="mt-8 flex-1 space-y-7 overflow-y-auto pr-1">
          {menu.map((secao) => (
            <div key={secao.titulo}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-subtle">
                {secao.titulo}
              </p>
              <ul aria-label={secao.titulo} className="space-y-1">
                {secao.itens.map(({ rotulo, to, icone: Icone, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-primary/15 font-semibold text-primary'
                            : 'text-muted hover:bg-surface hover:text-ink',
                        )
                      }
                    >
                      <Icone size={18} aria-hidden className="shrink-0" />
                      <span className="leading-tight">{rotulo}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <ThemeToggle />
      </div>
    </>
  );
}
