import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import { RotaAnonima, RotaGestor, RotaPermissao, RotaProtegida } from './components/layout/Rotas';
import { inicioAdmin } from './config/navigation';
import { useAuth } from './context/AuthContext';
import { CarregandoTela } from './components/ui/Estados';

// Cada tela vira um arquivo JS separado, baixado só quando é aberta.
const Login = lazy(() => import('./pages/Login'));
const NaoEncontrada = lazy(() => import('./pages/NaoEncontrada'));

const Inicio = lazy(() => import('./pages/aluno/Inicio'));
const Explorar = lazy(() => import('./pages/aluno/explorar/Explorar'));
const TodosCursos = lazy(() => import('./pages/aluno/explorar/TodosCursos'));
const Destaques = lazy(() => import('./pages/aluno/explorar/Destaques'));
const ParaVoce = lazy(() => import('./pages/aluno/explorar/ParaVoce'));
const Areas = lazy(() => import('./pages/aluno/explorar/Areas'));
const Trilhas = lazy(() => import('./pages/aluno/Trilhas'));
const Trilha = lazy(() => import('./pages/aluno/Trilha'));
const MeuProgresso = lazy(() => import('./pages/aluno/MeuProgresso'));
const Perfil = lazy(() => import('./pages/aluno/Perfil'));
const Suporte = lazy(() => import('./pages/aluno/Suporte'));
const SalaDeAula = lazy(() => import('./pages/aluno/SalaDeAula'));

const VisaoGeral = lazy(() => import('./pages/admin/VisaoGeral'));
const Colaboradores = lazy(() => import('./pages/admin/Colaboradores'));
const Relatorios = lazy(() => import('./pages/admin/Relatorios'));
const Gestores = lazy(() => import('./pages/admin/Gestores'));
const Faturamento = lazy(() => import('./pages/admin/Faturamento'));
const Configuracoes = lazy(() => import('./pages/admin/Configuracoes'));
const Ajuda = lazy(() => import('./pages/admin/Ajuda'));

/** "/admin" abre a primeira tela que o papel pode ver (Financeiro → Faturamento). */
function InicioAdmin() {
  const { pode } = useAuth();
  return pode('admin.visao') ? <VisaoGeral /> : <Navigate to={inicioAdmin(pode)} replace />;
}

/**
 * Tabela de rotas.
 *
 * Aluno (qualquer usuário autenticado)
 *   /                         Início (continuar estudando, cursos, atividades)
 *   /explorar[/destaques|/para-voce|/areas]   Catálogo (?q=&categoria=&area=&nivel=&pagina=)
 *   /trilhas, /trilhas/:id    Trilhas de carreira
 *   /cursos/:id[/aulas/:aulaId]  Sala de aula
 *   /progresso                Níveis e certificados
 *   /perfil, /suporte
 *
 * Painel da empresa (papéis admin, rh, lider, financeiro — ver AuthContext)
 *   /admin, /admin/colaboradores, /admin/relatorios, /admin/gestores,
 *   /admin/faturamento, /admin/configuracoes, /admin/ajuda
 */
export default function App() {
  return (
    <Suspense fallback={<CarregandoTela />}>
      <Routes>
        <Route element={<RotaAnonima />}>
          <Route path="login" element={<Login />} />
        </Route>

        <Route element={<RotaProtegida />}>
          <Route element={<AppLayout variant="aluno" />}>
            <Route index element={<Inicio />} />

            <Route path="explorar" element={<Explorar />}>
              <Route index element={<TodosCursos />} />
              <Route path="destaques" element={<Destaques />} />
              <Route path="para-voce" element={<ParaVoce />} />
              <Route path="areas" element={<Areas />} />
            </Route>

            <Route path="trilhas" element={<Trilhas />} />
            <Route path="trilhas/:trilhaId" element={<Trilha />} />
            <Route path="cursos/:cursoId" element={<SalaDeAula />} />
            <Route path="cursos/:cursoId/aulas/:aulaId" element={<SalaDeAula />} />
            <Route path="progresso" element={<MeuProgresso />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="suporte" element={<Suporte />} />

            {/* Endereços antigos continuam funcionando (favoritos, links enviados). */}
            <Route path="cursos" element={<Navigate to="/explorar" replace />} />
            <Route path="destaques" element={<Navigate to="/explorar/destaques" replace />} />
            <Route path="recomendados" element={<Navigate to="/explorar/para-voce" replace />} />
            <Route path="areas" element={<Navigate to="/explorar/areas" replace />} />
            <Route path="niveis" element={<Navigate to="/progresso" replace />} />
            <Route path="area-do-aluno" element={<Navigate to="/" replace />} />

            <Route path="*" element={<NaoEncontrada />} />
          </Route>

          <Route path="admin" element={<RotaGestor />}>
            <Route element={<AppLayout variant="admin" />}>
              <Route index element={<InicioAdmin />} />
              <Route
                path="colaboradores"
                element={
                  <RotaPermissao permissao="admin.colaboradores">
                    <Colaboradores />
                  </RotaPermissao>
                }
              />
              <Route
                path="relatorios"
                element={
                  <RotaPermissao permissao="admin.relatorios">
                    <Relatorios />
                  </RotaPermissao>
                }
              />
              <Route
                path="gestores"
                element={
                  <RotaPermissao permissao="admin.gestores">
                    <Gestores />
                  </RotaPermissao>
                }
              />
              <Route
                path="faturamento"
                element={
                  <RotaPermissao permissao="admin.faturamento">
                    <Faturamento />
                  </RotaPermissao>
                }
              />
              <Route
                path="configuracoes"
                element={
                  <RotaPermissao permissao="admin.configuracoes">
                    <Configuracoes />
                  </RotaPermissao>
                }
              />
              <Route
                path="ajuda"
                element={
                  <RotaPermissao permissao="admin.ajuda">
                    <Ajuda />
                  </RotaPermissao>
                }
              />

              <Route path="funcionarios" element={<Navigate to="/admin/colaboradores" replace />} />
              <Route path="contas" element={<Navigate to="/admin/gestores" replace />} />
              <Route path="pagamento" element={<Navigate to="/admin/faturamento" replace />} />

              <Route path="*" element={<NaoEncontrada inicio="/admin" />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
