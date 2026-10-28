import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { menuAdmin, menuAluno } from '../../config/navigation';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';

/**
 * Layout base compartilhado por todas as telas:
 * Sidebar fixa (ou gaveta modal com prisão de foco no mobile) + TopNavigation sticky + conteúdo (<Outlet />).
 */
export default function AppLayout({ variant = 'aluno' }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const primeiraRenderizacao = useRef(true);

  // A cada navegação: fecha a gaveta mobile, volta ao topo e move o foco
  // para o conteúdo (leitores de tela anunciam a nova página).
  useEffect(() => {
    setMenuAberto(false);
    window.scrollTo({ top: 0 });
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-onprimary"
      >
        Ir para o conteúdo principal
      </a>

      <Sidebar
        menu={variant === 'admin' ? menuAdmin : menuAluno}
        aberta={menuAberto}
        onFechar={() => setMenuAberto(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-56">
        <TopNavigation variant={variant} onAbrirMenu={() => setMenuAberto(true)} />
        <main
          id="conteudo"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-16 pt-4 focus:outline-none sm:px-6 lg:px-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
