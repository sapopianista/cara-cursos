import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Descobrir from './pages/Descobrir';
import CursosDestaque from './pages/CursosDestaque';
import CursosRecomendados from './pages/CursosRecomendados';
import ContatoSuporteAluno from './pages/ContatoSuporteAluno';
import DashboardAluno from './pages/DashboardAluno';
import TodosCursos from './pages/TodosCursos';
import CursosPorArea from './pages/CursosPorArea';
import NiveisDesenvolvimento from './pages/NiveisDesenvolvimento';
import SalaDeAula from './pages/SalaDeAula';
import Funcionarios from './pages/admin/Funcionarios';
import DashboardCorporativo from './pages/admin/DashboardCorporativo';
import RelatoriosCorporativos from './pages/admin/RelatoriosCorporativos';
import ConfiguracoesCorporativas from './pages/admin/ConfiguracoesCorporativas';
import CentralAjudaCorporativa from './pages/admin/CentralAjudaCorporativa';
import GerenciamentoContas from './pages/admin/GerenciamentoContas';
import PlanosPagamento from './pages/admin/PlanosPagamento';
import Login from './pages/Login';
import EmConstrucao from './pages/EmConstrucao';

/**
 * Tabela de Rotas do Sistema Acadêmico Cara Cursos.
 *
 * Mapeamento:
 * - "/"                  -> Descobrir (Portal de Aprendizado / Nova Homepage)
 * - "/area-do-aluno"     -> Dashboard do Aluno (Meta, Continuar assistindo, Cursos, Atividades)
 * - "/cursos"            -> Catálogo Completo (Filtros, Níveis, Categorias, Paginação)
 * - "/cursos/:id"        -> Sala de Aula (Player de Vídeo HD, Trilha, Aulas, Atividades)
 * - "/admin"             -> Dashboard Corporativo (Visão Executiva, Gráficos de Retenção/Sessões)
 * - "/admin/funcionarios"-> Gestão de Colaboradores (Métricas, Tabela, Modal de Cadastro, CSV)
 * - "/login"             -> Login Corporativo Seguro (SSO, Criptografia, Dark Mode)
 */
export default function App() {
  return (
    <Routes>
      {/* Rota isolada de Autenticação */}
      <Route path="login" element={<Login />} />

      {/* Área do Aluno com Layout Base */}
      <Route element={<AppLayout variant="aluno" />}>
        {/* Nova Homepage solicitada: Tela Descobrir */}
        <Route index element={<Descobrir />} />
        
        {/* Telas Destaques, Recomendados & Contato/Suporte */}
        <Route path="destaques" element={<CursosDestaque />} />
        <Route path="recomendados" element={<CursosRecomendados />} />
        <Route path="suporte" element={<ContatoSuporteAluno />} />

        {/* Dashboard Pessoal do Aluno (área dedicada) */}
        <Route path="area-do-aluno" element={<DashboardAluno />} />

        {/* Catálogo, Trilhas de Carreira e Sala de Aula */}
        <Route path="cursos" element={<TodosCursos />} />
        <Route path="cursos/:id" element={<SalaDeAula />} />
        <Route path="trilhas" element={<SalaDeAula />} />
        <Route path="trilhas/:id" element={<SalaDeAula />} />
        <Route path="areas" element={<CursosPorArea />} />
        <Route path="niveis" element={<NiveisDesenvolvimento />} />
        <Route path="perfil" element={<EmConstrucao titulo="Perfil do Colaborador" />} />
      </Route>

      {/* Visão Corporativa (RH / Gestão Executiva) */}
      <Route path="admin" element={<AppLayout variant="admin" />}>
        <Route index element={<DashboardCorporativo />} />
        <Route path="funcionarios" element={<Funcionarios />} />
        <Route path="relatorios" element={<RelatoriosCorporativos />} />
        <Route path="configuracoes" element={<ConfiguracoesCorporativas />} />
        <Route path="pagamento" element={<PlanosPagamento />} />
        <Route path="contas" element={<GerenciamentoContas />} />
        <Route path="ajuda" element={<CentralAjudaCorporativa />} />
      </Route>

      {/* Rota 404 */}
      <Route path="*" element={<EmConstrucao titulo="Página não encontrada" />} />
    </Routes>
  );
}
