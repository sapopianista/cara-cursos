import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { SkeletonPagina } from '../../../components/ui/Estados';
import Pagina from '../../../components/ui/Pagina';
import AbasNavegacao from '../../../components/ui/AbasNavegacao';

const ABAS = [
  { to: '/explorar', rotulo: 'Todos os cursos', end: true },
  { to: '/explorar/destaques', rotulo: 'Destaques' },
  { to: '/explorar/para-voce', rotulo: 'Para você' },
  { to: '/explorar/areas', rotulo: 'Por área' },
];

/** Catálogo: um só lugar para encontrar cursos, com abas que são rotas.
 * O <title> da aba é definido por cada sub-tela. */
export default function Explorar() {
  return (
    <Pagina
      titulo="Explorar"
      tituloAba={false}
      descricao="Encontre cursos para o seu momento profissional."
      largura="larga"
    >
      <AbasNavegacao abas={ABAS} rotulo="Seções do catálogo" />
      {/* Ao trocar de aba, só o conteúdo carrega: título e abas ficam no lugar. */}
      <Suspense fallback={<SkeletonPagina cabecalho={false} largura="max-w-none" />}>
        <Outlet />
      </Suspense>
    </Pagina>
  );
}
