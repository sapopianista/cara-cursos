/**
 * ÚNICO ponto da aplicação que conversa com o backend.
 *
 * Cada função chama a API REST real (via `http`) ou, com VITE_USAR_MOCK=true,
 * a implementação simulada em ./mock/handlers.js — que devolve exatamente o
 * mesmo formato. Os componentes nunca sabem de onde os dados vêm.
 *
 * Contratos completos (corpo de requisição e resposta): docs/API.md
 */
import { USAR_MOCK } from '../config/ambiente';
import { baixarArquivo, http } from './http';
import * as mock from './mock/handlers';

/** Escolhe a implementação conforme o ambiente. */
const endpoint = (simulado, real) => (USAR_MOCK ? simulado : real);

// ---- Autenticação -------------------------------------------------------

/** POST /auth/login  { identificador, senha, lembrar } -> { token, usuario } */
export const entrar = endpoint(mock.entrar, (credenciais) => http.post('/auth/login', credenciais));

/** GET /auth/me -> usuario (valida o token salvo ao recarregar a página) */
export const obterSessao = endpoint(mock.obterSessao, () => http.get('/auth/me'));

/** POST /auth/logout */
export const sair = endpoint(mock.sair, () => http.post('/auth/logout'));

/** Contas de demonstração exibidas no login (somente no modo mock). */
export const contasDemo = USAR_MOCK ? mock.contasDemo : [];

// ---- Aluno --------------------------------------------------------------

/** GET /alunos/me/inicio */
export const getInicio = endpoint(mock.getInicio, () => http.get('/alunos/me/inicio'));

/** GET /alunos/me/progresso (níveis + certificados) */
export const getProgresso = endpoint(mock.getProgresso, () => http.get('/alunos/me/progresso'));

/** GET /alunos/me/perfil */
export const getPerfil = endpoint(mock.getPerfil, () => http.get('/alunos/me/perfil'));

/** PUT /alunos/me/preferencias */
export const atualizarPreferencias = endpoint(mock.atualizarPreferencias, (p) =>
  http.put('/alunos/me/preferencias', p),
);

/** GET /alunos/me/recomendacoes */
export const getRecomendacoes = endpoint(mock.getRecomendacoes, () => http.get('/alunos/me/recomendacoes'));

/** GET /certificados/{id}/arquivo (PDF) */
export const baixarCertificado = (certificado) =>
  baixarArquivo(
    certificado.url ?? `/certificados/${certificado.id}/arquivo`,
    `certificado-${certificado.codigo}.pdf`,
  );

// ---- Catálogo -----------------------------------------------------------

/** GET /cursos?q=&categoria=&area=&nivel=&pagina=&porPagina= -> Página<Curso> */
export const listarCursos = endpoint(mock.listarCursos, (filtros) => http.get('/cursos', filtros));

/** GET /cursos/categorias */
export const listarCategorias = endpoint(mock.listarCategorias, () => http.get('/cursos/categorias'));

/** GET /areas */
export const listarAreas = endpoint(mock.listarAreas, () => http.get('/areas'));

/** GET /cursos/destaques */
export const getDestaques = endpoint(mock.getDestaques, () => http.get('/cursos/destaques'));

// ---- Trilhas ------------------------------------------------------------

/** GET /trilhas */
export const listarTrilhas = endpoint(mock.listarTrilhas, () => http.get('/trilhas'));

/** GET /trilhas/{id} */
export const getTrilha = endpoint(mock.getTrilha, (id) => http.get(`/trilhas/${id}`));

// ---- Sala de aula -------------------------------------------------------

/** GET /cursos/{id}/sala */
export const getSalaDeAula = endpoint(mock.getSalaDeAula, (cursoId) => http.get(`/cursos/${cursoId}/sala`));

/** PUT /cursos/{id}/aulas/{aulaId}/progresso  { posicaoSegundos } */
export const salvarProgressoAula = endpoint(mock.salvarProgressoAula, (cursoId, aulaId, posicaoSegundos) =>
  http.put(`/cursos/${cursoId}/aulas/${aulaId}/progresso`, { posicaoSegundos }),
);

/** POST /cursos/{id}/aulas/{aulaId}/conclusao -> { aula, progressoCurso } */
export const concluirAula = endpoint(mock.concluirAula, (cursoId, aulaId) =>
  http.post(`/cursos/${cursoId}/aulas/${aulaId}/conclusao`),
);

/** POST /atividades/{id}/entregas  { resposta } */
export const entregarAtividade = endpoint(mock.entregarAtividade, (id, corpo) =>
  http.post(`/atividades/${id}/entregas`, corpo),
);

/** Download de material de apoio (URL vem da API). */
export const baixarMaterial = (material) => baixarArquivo(material.url, material.nome);

// ---- Notificações -------------------------------------------------------

/** GET /notificacoes */
export const listarNotificacoes = endpoint(mock.listarNotificacoes, () => http.get('/notificacoes'));

/** POST /notificacoes/{id}/leitura */
export const marcarNotificacaoLida = endpoint(mock.marcarNotificacaoLida, (id) =>
  http.post(`/notificacoes/${id}/leitura`),
);

/** POST /notificacoes/leitura */
export const marcarTodasNotificacoesLidas = endpoint(mock.marcarTodasNotificacoesLidas, () =>
  http.post('/notificacoes/leitura'),
);

// ---- Suporte (escopo: 'aluno' | 'gestor') -------------------------------

/** GET /suporte?escopo= -> { faq, contato, assuntos, cursos, chamados } */
export const getSuporte = endpoint(mock.getSuporte, (escopo) => http.get('/suporte', { escopo }));

/** POST /suporte/chamados  { escopo, assunto, titulo, cursoId?, descricao } */
export const abrirChamado = endpoint(mock.abrirChamado, (escopo, dados) =>
  http.post('/suporte/chamados', { escopo, ...dados }),
);

// ---- Admin: visão geral -------------------------------------------------

/** GET /admin/dashboard?periodo=7dias|30dias|trimestre */
export const getDashboardCorporativo = endpoint(mock.getDashboard, (periodo) =>
  http.get('/admin/dashboard', { periodo }),
);

// ---- Admin: colaboradores -----------------------------------------------

/** GET /admin/colaboradores?busca=&status=&departamento=&pagina=&porPagina= -> Página<Colaborador> */
export const listarColaboradores = endpoint(mock.listarColaboradores, (filtros) =>
  http.get('/admin/colaboradores', filtros),
);

/** GET /admin/colaboradores/resumo */
export const getResumoColaboradores = endpoint(mock.getResumoColaboradores, () =>
  http.get('/admin/colaboradores/resumo'),
);

/** GET /admin/colaboradores/opcoes -> { cargos, departamentos, niveis } */
export const getOpcoesColaboradores = endpoint(mock.getOpcoesColaboradores, () =>
  http.get('/admin/colaboradores/opcoes'),
);

/** POST /admin/colaboradores */
export const criarColaborador = endpoint(mock.criarColaborador, (dados) =>
  http.post('/admin/colaboradores', dados),
);

/** PUT /admin/colaboradores/{id} */
export const atualizarColaborador = endpoint(mock.atualizarColaborador, (id, dados) =>
  http.put(`/admin/colaboradores/${id}`, dados),
);

/** PATCH /admin/colaboradores/{id}/status  { status } */
export const alterarStatusColaborador = endpoint(mock.alterarStatusColaborador, (id, status) =>
  http.patch(`/admin/colaboradores/${id}/status`, { status }),
);

/** GET /admin/colaboradores/{id}/progresso */
export const getProgressoColaborador = endpoint(mock.getProgressoColaborador, (id) =>
  http.get(`/admin/colaboradores/${id}/progresso`),
);

/** GET /admin/colaboradores/exportar?busca=&status=  (text/csv) */
export const exportarColaboradores = endpoint(mock.exportarColaboradores, (filtros) =>
  baixarArquivo('/admin/colaboradores/exportar', 'colaboradores.csv', filtros),
);

// ---- Admin: gestores e permissões ---------------------------------------

/** GET /admin/gestores -> { gestores, papeis, candidatos } */
export const listarGestores = endpoint(mock.listarGestores, () => http.get('/admin/gestores'));

/** POST /admin/gestores  { colaboradorId, papel } */
export const convidarGestor = endpoint(mock.convidarGestor, (dados) => http.post('/admin/gestores', dados));

/** PATCH /admin/gestores/{id}  { papel } */
export const alterarPapelGestor = endpoint(mock.alterarPapelGestor, (id, papel) =>
  http.patch(`/admin/gestores/${id}`, { papel }),
);

/** DELETE /admin/gestores/{id} */
export const revogarGestor = endpoint(mock.revogarGestor, (id) => http.delete(`/admin/gestores/${id}`));

/** POST /admin/gestores/{id}/convite */
export const reenviarConvite = endpoint(mock.reenviarConvite, (id) =>
  http.post(`/admin/gestores/${id}/convite`),
);

/** GET /admin/auditoria */
export const listarAuditoria = endpoint(mock.listarAuditoria, () => http.get('/admin/auditoria'));

// ---- Admin: relatórios --------------------------------------------------

/** GET /admin/relatorios -> { modelos, departamentos, historico } */
export const getRelatorios = endpoint(mock.getRelatorios, () => http.get('/admin/relatorios'));

/** POST /admin/relatorios  { modeloId, periodo, departamento? } -> Relatorio (status "processando") */
export const gerarRelatorio = endpoint(mock.gerarRelatorio, (dados) => http.post('/admin/relatorios', dados));

/** GET /admin/relatorios/{id}/arquivo */
export const baixarRelatorio = (relatorio) =>
  baixarArquivo(relatorio.url ?? `/admin/relatorios/${relatorio.id}/arquivo`, `relatorio-${relatorio.id}`);

// ---- Admin: plano e faturamento -----------------------------------------

/** GET /admin/faturamento */
export const getFaturamento = endpoint(mock.getFaturamento, () => http.get('/admin/faturamento'));

/** POST /admin/faturamento/licencas  { quantidade } */
export const contratarLicencas = endpoint(mock.contratarLicencas, (quantidade) =>
  http.post('/admin/faturamento/licencas', { quantidade }),
);

/** Nota fiscal (URL vem da API). */
export const baixarNotaFiscal = (fatura) =>
  baixarArquivo(fatura.notaFiscal.url, `${fatura.notaFiscal.numero}.pdf`);

// ---- Admin: configurações -----------------------------------------------

/** GET /admin/configuracoes */
export const getConfiguracoes = endpoint(mock.getConfiguracoes, () => http.get('/admin/configuracoes'));

/** PUT /admin/configuracoes */
export const salvarConfiguracoes = endpoint(mock.salvarConfiguracoes, (config) =>
  http.put('/admin/configuracoes', config),
);
