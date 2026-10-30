import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { menuAdmin, menuAluno } from '../../config/navigation';
import { SkeletonPagina } from '../ui/Estados';
import Sidebar from './Sidebar';
import TopNavigation from './TopNavigation';

/**
 * Layout base: Sidebar fixa (ou gaveta no mobile) + barra superior sticky + conteúdo.
 * O <Suspense> fica aqui dentro para que, ao trocar de tela, só o conteúdo
 * mostre o carregamento — o menu e a barra continuam no lugar.
 */
export default function AppLayout({ variant = 'aluno' }) {
  const admin = variant === 'admin';
  const [menuAberto, setMenuAberto] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const primeiraRenderizacao = useRef(true);

  // A cada navegação: volta ao topo e move o foco para o conteúdo (leitores
  // de tela anunciam a nova página). A gaveta fecha no clique do item.
  useEffect(() => {
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
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-onprimary"
      >
        Ir para o conteúdo principal
      </a>

      <Sidebar
        menu={admin ? menuAdmin : menuAluno}
        admin={admin}
        aberta={menuAberto}
        onFechar={() => setMenuAberto(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-60">
        <TopNavigation admin={admin} onAbrirMenu={() => setMenuAberto(true)} />
        <main
          id="conteudo"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-16 pt-4 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:px-6 lg:px-8"
        >
          <Suspense fallback={<SkeletonPagina />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
