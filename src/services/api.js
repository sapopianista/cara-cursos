import { dashboardAluno } from '../data/dashboardAluno';
import { descobrirData } from '../data/descobrir';
import { catalogoCursos, salaDeAulaData } from '../data/cursos';
import { funcionariosData } from '../data/funcionarios';
import { dashboardCorporativoData } from '../data/dashboardCorporativo';

/**
 * Camada de acesso à API REST (backend Java/JDBC).
 *
 * Para alternar entre Mock e API real:
 *   - Em .env defina: VITE_USAR_MOCK=false
 *   - Aponte VITE_API_URL para o servidor Java (ex: http://localhost:8080/api)
 */
const API_URL = import.meta.env.VITE_API_URL ?? '/api';
const USAR_MOCK = import.meta.env.VITE_USAR_MOCK !== 'false';

async function requisicao(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  });
  if (!resposta.ok) {
    throw new Error(`Erro ${resposta.status} ao acessar ${caminho}`);
  }
  return resposta.json();
}

/** Simula latência de rede realista para testar Skeletons e estados de loading. */
const simular = (dados, ms = 400) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(dados)), ms));

// ---- Endpoints de Aluno ------------------------------------------------

/** GET /api/alunos/me/dashboard */
export const getDashboardAluno = () =>
  USAR_MOCK ? simular(dashboardAluno) : requisicao('/alunos/me/dashboard');

/** GET /api/alunos/me/descobrir */
export const getDescobrir = () =>
  USAR_MOCK ? simular(descobrirData) : requisicao('/alunos/me/descobrir');

/** POST /api/atividades/{id}/entregas */
export const enviarAtividade = (atividadeId) =>
  USAR_MOCK
    ? simular({ ok: true, mensagem: 'Atividade enviada com sucesso!' }, 500)
    : requisicao(`/atividades/${atividadeId}/entregas`, { method: 'POST' });

/** POST /api/cursos/{id}/favoritos */
export const alternarFavorito = (cursoId) =>
  USAR_MOCK
    ? simular({ ok: true }, 200)
    : requisicao(`/cursos/${cursoId}/favoritos`, { method: 'POST' });

// ---- Endpoints de Catálogo e Sala de Aula -----------------------------

/** GET /api/cursos */
export const getCursos = () =>
  USAR_MOCK ? simular(catalogoCursos) : requisicao('/cursos');

/** GET /api/cursos/{id}/sala-de-aula */
export const getSalaDeAula = (cursoId) =>
  USAR_MOCK ? simular(salaDeAulaData) : requisicao(`/cursos/${cursoId}/sala-de-aula`);

// ---- Endpoints Corporativos (Admin / RH) -------------------------------

/** GET /api/admin/dashboard?periodo=... */
export const getDashboardCorporativo = (periodo = '7dias') =>
  USAR_MOCK ? simular(dashboardCorporativoData) : requisicao(`/admin/dashboard?periodo=${periodo}`);

/** GET /api/admin/funcionarios */
export const getFuncionarios = () =>
  USAR_MOCK ? simular(funcionariosData) : requisicao('/admin/funcionarios');

/** POST /api/admin/funcionarios */
export const adicionarFuncionario = (novoFuncionario) => {
  if (USAR_MOCK) {
    const item = {
      id: `#COL-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'ativo',
      ultimoAcesso: 'Hoje',
      ...novoFuncionario,
    };
    funcionariosData.lista.unshift(item);
    funcionariosData.total += 1;
    funcionariosData.metricas.totalMembros += 1;
    funcionariosData.metricas.colaboradoresAtivos += 1;
    return simular(item, 500);
  }
  return requisicao('/admin/funcionarios', {
    method: 'POST',
    body: JSON.stringify(novoFuncionario),
  });
};

// ---- Autenticação -----------------------------------------------------

/** POST /api/auth/login */
export const loginCorporativo = (credenciais) =>
  USAR_MOCK
    ? simular({ token: 'mock-jwt-token-cara-cursos', usuario: { nome: 'Tiago', perfil: 'aluno' } }, 700)
    : requisicao('/auth/login', { method: 'POST', body: JSON.stringify(credenciais) });
