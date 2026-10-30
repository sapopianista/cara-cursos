import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../context/AuthContext';
import { useFocusTrap } from '../ui/Modal';
import Button from '../ui/Button';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

function ItemMenu({ rotulo, to, icone: Icone, end, onNavegar }) {
  return (
    <li>
      <NavLink
        to={to}
        end={end}
        onClick={onNavegar}
        className={({ isActive }) =>
          cn(
            'relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors duration-150',
            isActive
              ? 'bg-primary/15 font-semibold text-primary before:absolute before:-left-4 before:top-2 before:h-6 before:w-1 before:rounded-r-full before:bg-primary'
              : 'text-muted hover:bg-surface hover:text-ink',
          )
        }
      >
        <Icone size={18} aria-hidden className="shrink-0" />
        <span className="leading-tight">{rotulo}</span>
      </NavLink>
    </li>
  );
}

/**
 * Menu lateral. Fixo no desktop (lg+), gaveta deslizante com foco preso no mobile.
 * Fechada no mobile, fica `invisible` (fora da tabulação e da árvore de acessibilidade).
 */
export default function Sidebar({ menu, admin = false, aberta, onFechar }) {
  const gavetaRef = useRef(null);
  const { pode } = useAuth();
  useFocusTrap(gavetaRef, aberta, onFechar);

  const permitido = (item) => !item.permissao || pode(item.permissao);
  const secoes = menu.secoes
    .map((s) => ({ ...s, itens: s.itens.filter(permitido) }))
    .filter((s) => s.itens.length > 0);
  const rodape = menu.rodape.filter(permitido);

  return (
    <>
      <div
        onClick={onFechar}
        aria-hidden
        className={cn(
          'fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          aberta ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <div
        ref={gavetaRef}
        role={aberta ? 'dialog' : undefined}
        aria-modal={aberta ? 'true' : undefined}
        aria-label={aberta ? 'Menu de navegação' : undefined}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-sidebar px-4 pb-4 pt-5 transition-[transform,visibility] duration-300 ease-suave lg:visible lg:w-60 lg:translate-x-0',
          aberta ? 'translate-x-0' : '-translate-x-full max-lg:invisible',
        )}
      >
        <div className="flex items-center justify-between px-2">
          <Logo to={admin ? '/admin' : '/'} onClick={onFechar} />
          <Button
            variante="ghost"
            tamanho="sm"
            apenasIcone
            onClick={onFechar}
            aria-label="Fechar menu"
            className="lg:hidden"
          >
            <X size={20} aria-hidden />
          </Button>
        </div>

        {/* Indicador de modo: deixa claro que se está no painel da empresa. */}
        {admin && (
          <p className="mx-2 mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-warn/15 px-2.5 py-1 text-xs font-semibold text-warn">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-warn" />
            Painel da empresa
          </p>
        )}

        <nav aria-label="Menu principal" className="mt-6 flex flex-1 flex-col overflow-y-auto pr-1">
          <div className="space-y-6">
            {secoes.map((secao, i) => (
              <div key={secao.titulo ?? i}>
                {secao.titulo && (
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-subtle">
                    {secao.titulo}
                  </p>
                )}
                <ul className="space-y-1">
                  {secao.itens.map((item) => (
                    <ItemMenu key={item.to} {...item} onNavegar={onFechar} />
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {rodape.length > 0 && (
            <ul className="mt-auto space-y-1 border-t border-line pt-4">
              {rodape.map((item) => (
                <ItemMenu key={item.to} {...item} onNavegar={onFechar} />
              ))}
            </ul>
          )}
        </nav>

        <ThemeToggle className="mt-3" />
      </div>
    </>
  );
}
