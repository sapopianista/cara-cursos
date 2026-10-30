/**
 * Implementações simuladas dos endpoints (mesma assinatura e mesmo formato de
 * resposta da API real). Usadas apenas com VITE_USAR_MOCK=true.
 */
import { ErroApi } from '../http';
import { gerarCsv, salvarBlob } from '../../lib/download';
import { emailValido, cnpjValido } from '../../lib/validacao';
import * as db from './db';

// ---------------------------------------------------------------- utilitários

const LATENCIA = import.meta.env.MODE === 'test' ? 0 : 350;

/** Simula a rede: atraso + cópia profunda (o chamador nunca altera o "banco"). */
const responder = (dados, ms = LATENCIA) =>
  new Promise((resolve) =>
    setTimeout(() => resolve(dados === undefined ? null : structuredClone(dados)), ms),
  );

const falhar = (status, mensagem, extras = {}, ms = LATENCIA) =>
  new Promise((_, reject) => setTimeout(() => reject(new ErroApi(mensagem, { status, ...extras })), ms));

const normalizar = (t = '') => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const paginar = (lista, pagina = 1, porPagina = 10) => {
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const atual = Math.min(Math.max(1, Number(pagina) || 1), totalPaginas);
  return {
    itens: lista.slice((atual - 1) * porPagina, atual * porPagina),
    total,
    pagina: atual,
    porPagina,
    totalPaginas,
  };
};

const proximoId = (lista, campo = 'id') => Math.max(0, ...lista.map((i) => Number(i[campo]) || 0)) + 1;

// ---------------------------------------------------------------- sessão

let usuarioLogadoId = null;

const PAPEL_COLABORADOR = 'colaborador';

const montarUsuario = (colaboradorId) => {
  const c = db.colaboradores.find((x) => x.id === colaboradorId);
  if (!c) return null;
  const gestor = db.gestores.find((g) => g.colaboradorId === c.id && g.status === 'ativo');
  return {
    id: c.id,
    nome: c.nome,
    email: c.email,
    cargo: c.cargo,
    departamento: c.departamento,
    papel: gestor?.papel ?? PAPEL_COLABORADOR,
    empresa: { id: db.empresa.id, nome: db.empresa.nomeFantasia },
  };
};

const usuarioAtual = () => montarUsuario(usuarioLogadoId);

export function entrar({ identificador, senha }) {
  const email = String(identificador ?? '')
    .trim()
    .toLowerCase();
  const colaborador = db.colaboradores.find((c) => c.email === email);
  if (!colaborador || String(senha ?? '').length < 6) {
    return falhar(401, 'E-mail ou senha incorretos.', { codigo: 'CREDENCIAIS_INVALIDAS' }, 600);
  }
  if (colaborador.status === 'inativo') {
    return falhar(403, 'Seu acesso está desativado. Fale com o RH da sua empresa.', {}, 600);
  }
  usuarioLogadoId = colaborador.id;
  return responder({ token: `mock-token-${colaborador.id}`, usuario: usuarioAtual() }, 600);
}

export function obterSessao(token) {
  const id = Number(String(token ?? '').replace('mock-token-', ''));
  const usuario = montarUsuario(id);
  if (!usuario) return falhar(401, 'Sua sessão expirou. Entre novamente.');
  usuarioLogadoId = id;
  return responder(usuario, 150);
}

export function sair() {
  usuarioLogadoId = null;
  return responder(null, 100);
}

export const contasDemo = db.contasDemo;

// ---------------------------------------------------------------- catálogo

const statusDoProgresso = (p) =>
  p == null || p === 0 ? 'nao_iniciado' : p >= 100 ? 'concluido' : 'em_andamento';

const enriquecerCurso = (c) => {
  const progresso = db.progressoCursos[c.id] ?? 0;
  return {
    ...c,
    categoria: db.categorias.find((x) => x.id === c.categoriaId),
    area: db.areas.find((x) => x.id === c.areaId),
    progresso,
    status: statusDoProgresso(progresso),
  };
};

export function listarCursos({ q, categoria, area, nivel, pagina = 1, porPagina = 12 } = {}) {
  const termo = normalizar(q);
  const lista = db.cursos
    .filter((c) => !categoria || c.categoriaId === categoria)
    .filter((c) => !area || c.areaId === area)
    .filter((c) => !nivel || c.nivel === nivel || c.nivel === 'todos')
    .filter((c) => !termo || normalizar(`${c.titulo} ${c.descricao} ${c.instrutor.nome}`).includes(termo))
    .map(enriquecerCurso);
  return responder(paginar(lista, pagina, porPagina));
}

export const listarCategorias = () => responder(db.categorias, 150);

export const listarAreas = () =>
  responder(
    db.areas.map((a) => {
      const doArea = db.cursos.filter((c) => c.areaId === a.id);
      return {
        ...a,
        totalCursos: doArea.length,
        duracaoMinutos: doArea.reduce((s, c) => s + c.duracaoMinutos, 0),
      };
    }),
  );

export const getDestaques = () =>
  responder({
    principal: enriquecerCurso(db.cursos.find((c) => c.id === db.destaqueDoMesId)),
    semana: db.cursos.filter((c) => c.destaque && c.id !== db.destaqueDoMesId).map(enriquecerCurso),
    lancamentos: db.cursos.filter((c) => c.lancamento && c.id !== db.destaqueDoMesId).map(enriquecerCurso),
  });

export function getRecomendacoes() {
  const usuario = usuarioAtual();
  const naoConcluido = (c) => (db.progressoCursos[c.id] ?? 0) < 100;
  return responder({
    perfil: { cargo: usuario?.cargo, departamento: usuario?.departamento },
    porCargo: db.cursos
      .filter((c) => ['operacoes', 'lideranca'].includes(c.areaId) && naoConcluido(c))
      .slice(0, 3)
      .map((c) => ({
        curso: enriquecerCurso(c),
        motivo: `Indicado para quem atua em ${usuario?.departamento ?? 'sua área'}`,
      })),
    continuidade: {
      baseadoEm: db.cursos.find((c) => c.id === 13).titulo,
      cursos: [9, 14, 8].map((id) => ({
        curso: enriquecerCurso(db.cursos.find((c) => c.id === id)),
        motivo: 'Complementa um curso que você concluiu',
      })),
    },
  });
}

// ---------------------------------------------------------------- sala de aula

const resumoCurso = (c) => ({
  id: c.id,
  titulo: c.titulo,
  categoria: db.categorias.find((x) => x.id === c.categoriaId)?.nome,
});

export function getSalaDeAula(cursoId) {
  const c = db.cursos.find((x) => x.id === Number(cursoId));
  if (!c) return falhar(404, 'Este curso não existe ou foi removido do catálogo.');
  const aulas = db.aulasPorCurso[c.id];
  const trilha = db.trilhas.find((t) => t.cursoIds.includes(c.id));
  const atual =
    aulas.find((a) => a.status === 'em_andamento') ?? aulas.find((a) => a.status === 'pendente') ?? aulas[0];
  return responder({
    curso: { ...enriquecerCurso(c), trilha: trilha ? { id: trilha.id, titulo: trilha.titulo } : null },
    aulas,
    aulaAtualId: atual.id,
    materiais: db.materiaisPorCurso[c.id] ?? [],
    atividades: db.atividades.filter((a) => a.cursoId === c.id),
  });
}

const recalcularProgresso = (cursoId) => {
  const aulas = db.aulasPorCurso[cursoId];
  const concluidas = aulas.filter((a) => a.status === 'concluida').length;
  db.progressoCursos[cursoId] = Math.round((concluidas / aulas.length) * 100);
  return db.progressoCursos[cursoId];
};

export function salvarProgressoAula(cursoId, aulaId, posicaoSegundos) {
  const aula = db.aulasPorCurso[Number(cursoId)]?.find((a) => a.id === Number(aulaId));
  if (!aula) return falhar(404, 'Aula não encontrada.');
  aula.posicaoSegundos = Math.round(posicaoSegundos);
  if (aula.status === 'pendente') aula.status = 'em_andamento';
  return responder(null, 80);
}

export function concluirAula(cursoId, aulaId) {
  const aula = db.aulasPorCurso[Number(cursoId)]?.find((a) => a.id === Number(aulaId));
  if (!aula) return falhar(404, 'Aula não encontrada.');
  aula.status = 'concluida';
  const progressoCurso = recalcularProgresso(Number(cursoId));
  return responder({ aula, progressoCurso }, 200);
}

export function entregarAtividade(atividadeId, { resposta } = {}) {
  const atividade = db.atividades.find((a) => a.id === Number(atividadeId));
  if (!atividade) return falhar(404, 'Atividade não encontrada.');
  if (!String(resposta ?? '').trim()) {
    return falhar(422, 'Escreva sua resposta antes de entregar.', {
      campos: { resposta: 'Escreva sua resposta.' },
    });
  }
  atividade.status = 'entregue';
  atividade.entregueEm = new Date().toISOString();
  return responder(atividade, 500);
}

// ---------------------------------------------------------------- aluno

export function getInicio() {
  const usuario = usuarioAtual();
  const emAndamento = db.cursos
    .filter((c) => {
      const p = db.progressoCursos[c.id] ?? 0;
      return p > 0 && p < 100;
    })
    .map(enriquecerCurso)
    .sort((a, b) => b.progresso - a.progresso);

  // "Continuar": a aula em andamento do curso mais recente (no mock, o curso 1).
  const cursoContinuar = db.cursos.find((c) => c.id === 1);
  const aulaContinuar =
    db.aulasPorCurso[1].find((a) => a.status === 'em_andamento') ?? db.aulasPorCurso[1][0];
  const posicao = aulaContinuar.posicaoSegundos;

  return responder({
    usuario: { nome: usuario?.nome.split(' ')[0] },
    metaSemanal: {
      minutosEstudados: 324,
      minutosMeta: db.preferenciasPorUsuario[usuarioLogadoId]?.metaSemanalMinutos ?? 480,
    },
    continuar: {
      curso: resumoCurso(cursoContinuar),
      aula: { id: aulaContinuar.id, ordem: aulaContinuar.ordem, titulo: aulaContinuar.titulo },
      percentualAssistido: Math.round((posicao / aulaContinuar.duracaoSegundos) * 100),
      minutosRestantes: Math.ceil((aulaContinuar.duracaoSegundos - posicao) / 60),
      tema: cursoContinuar.tema,
      imagemUrl: null,
    },
    cursosEmAndamento: emAndamento.slice(0, 4),
    atividades: db.atividades
      .filter((a) => a.status === 'pendente')
      .sort((a, b) => a.prazo.localeCompare(b.prazo))
      .map((a) => ({ ...a, curso: resumoCurso(db.cursos.find((c) => c.id === a.cursoId)) })),
  });
}

export function getProgresso() {
  let nivelAtualEncontrado = false;
  const niveis = db.niveis.map((n) => {
    const progressos = n.cursoIds.map((id) => db.progressoCursos[id] ?? 0);
    const concluidos = progressos.filter((p) => p >= 100).length;
    const progresso = Math.round(progressos.reduce((s, p) => s + p, 0) / progressos.length);
    let estado = 'bloqueado';
    if (concluidos === n.cursoIds.length) estado = 'concluido';
    else if (!nivelAtualEncontrado) {
      estado = 'em_andamento';
      nivelAtualEncontrado = true;
    }
    const proximo = n.cursoIds
      .map((id) => db.cursos.find((c) => c.id === id))
      .find((c) => (db.progressoCursos[c.id] ?? 0) < 100);
    const restantes = n.cursoIds
      .map((id) => db.cursos.find((c) => c.id === id))
      .reduce((s, c) => s + (c.duracaoMinutos * (100 - (db.progressoCursos[c.id] ?? 0))) / 100, 0);
    return {
      id: n.id,
      ordem: n.ordem,
      titulo: n.titulo,
      perfil: n.perfil,
      competencias: n.competencias,
      estado,
      progresso,
      cursosConcluidos: concluidos,
      cursosTotais: n.cursoIds.length,
      minutosRestantes: Math.round(restantes),
      proximoCurso: estado === 'em_andamento' && proximo ? { id: proximo.id, titulo: proximo.titulo } : null,
      cursos: n.cursoIds.map((id) => resumoCurso(db.cursos.find((c) => c.id === id))),
    };
  });
  const todos = db.niveis.flatMap((n) => n.cursoIds);
  const concluidos = todos.filter((id) => (db.progressoCursos[id] ?? 0) >= 100).length;
  return responder({
    resumo: {
      percentualGeral: Math.round((concluidos / todos.length) * 100),
      cursosConcluidos: concluidos,
      cursosTotais: todos.length,
      nivelAtual: niveis.find((n) => n.estado === 'em_andamento') ?? null,
    },
    niveis,
    certificados: db.certificados,
  });
}

export function getPerfil() {
  const usuario = usuarioAtual();
  const colaborador = db.colaboradores.find((c) => c.id === usuarioLogadoId);
  const concluidos = Object.values(db.progressoCursos).filter((p) => p >= 100).length;
  const minutos = db.cursos.reduce(
    (s, c) => s + (c.duracaoMinutos * (db.progressoCursos[c.id] ?? 0)) / 100,
    0,
  );
  return responder({
    ...usuario,
    matricula: colaborador?.matricula,
    membroDesde: colaborador?.criadoEm,
    estatisticas: {
      cursosConcluidos: concluidos,
      minutosEstudados: Math.round(minutos),
      certificados: db.certificados.length,
    },
    preferencias: {
      metaSemanalMinutos: 480,
      notificacoesEmail: true,
      resumoSemanal: true,
      ...db.preferenciasPorUsuario[usuarioLogadoId],
    },
  });
}

export function atualizarPreferencias(preferencias) {
  db.preferenciasPorUsuario[usuarioLogadoId] = {
    ...db.preferenciasPorUsuario[usuarioLogadoId],
    ...preferencias,
  };
  return responder(db.preferenciasPorUsuario[usuarioLogadoId], 400);
}

// ---------------------------------------------------------------- trilhas

const montarTrilha = (t, comCursos = false) => {
  const lista = t.cursoIds.map((id) => db.cursos.find((c) => c.id === id));
  const progresso = Math.round(lista.reduce((s, c) => s + (db.progressoCursos[c.id] ?? 0), 0) / lista.length);
  const base = {
    id: t.id,
    titulo: t.titulo,
    descricao: t.descricao,
    nivel: t.nivel,
    tema: t.tema,
    competencias: t.competencias,
    totalCursos: lista.length,
    duracaoMinutos: lista.reduce((s, c) => s + c.duracaoMinutos, 0),
    progresso,
    status: statusDoProgresso(progresso),
  };
  return comCursos ? { ...base, cursos: lista.map(enriquecerCurso) } : base;
};

export const listarTrilhas = () => responder(db.trilhas.map((t) => montarTrilha(t)));

export function getTrilha(id) {
  const t = db.trilhas.find((x) => x.id === Number(id));
  if (!t) return falhar(404, 'Esta trilha não existe.');
  return responder(montarTrilha(t, true));
}

// ---------------------------------------------------------------- notificações

export const listarNotificacoes = () =>
  responder(
    [...db.notificacoes].sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)),
    200,
  );

export function marcarNotificacaoLida(id) {
  const n = db.notificacoes.find((x) => x.id === Number(id));
  if (n) n.lida = true;
  return responder(null, 80);
}

export function marcarTodasNotificacoesLidas() {
  db.notificacoes.forEach((n) => (n.lida = true));
  return responder(null, 120);
}

// ---------------------------------------------------------------- suporte

export const getSuporte = (escopo) =>
  responder({
    faq: db.faq[escopo],
    contato: db.contatoSuporte[escopo],
    assuntos: db.assuntosChamado[escopo],
    cursos: escopo === 'aluno' ? db.cursos.map((c) => ({ id: c.id, titulo: c.titulo })) : [],
    chamados: db.chamados
      .filter((c) => c.escopo === escopo)
      .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
      .map((c) => ({
        ...c,
        curso: c.cursoId ? resumoCurso(db.cursos.find((x) => x.id === c.cursoId)) : null,
      })),
  });

export function abrirChamado(escopo, { assunto, titulo, cursoId, descricao }) {
  const campos = {};
  if (!assunto) campos.assunto = 'Escolha um assunto.';
  if (!String(titulo ?? '').trim()) campos.titulo = 'Resuma o problema em poucas palavras.';
  if (String(descricao ?? '').trim().length < 10) campos.descricao = 'Descreva com pelo menos 10 caracteres.';
  if (Object.keys(campos).length) return falhar(422, 'Revise os campos destacados.', { campos });
  const chamado = {
    id: proximoId(db.chamados),
    escopo,
    assunto,
    titulo: titulo.trim(),
    cursoId: cursoId ? Number(cursoId) : null,
    status: 'em_analise',
    atualizadoEm: new Date().toISOString(),
  };
  db.chamados.push(chamado);
  return responder(
    {
      ...chamado,
      curso: chamado.cursoId ? resumoCurso(db.cursos.find((x) => x.id === chamado.cursoId)) : null,
    },
    500,
  );
}

// ---------------------------------------------------------------- admin: dashboard

const DIAS_PERIODO = { '7dias': 7, '30dias': 30, trimestre: 90 };
const TURNOS_PERIODO = {
  '7dias': [44, 28, 18, 10],
  '30dias': [39, 32, 21, 8],
  trimestre: [36, 35, 22, 7],
};

export function getDashboard(periodo = '7dias') {
  const dias = DIAS_PERIODO[periodo] ?? 7;
  const limite = Date.now() - dias * 86_400_000;
  const ativos = db.colaboradores.filter((c) => c.status === 'ativo');
  const acessaram = ativos.filter((c) => c.ultimoAcesso && new Date(c.ultimoAcesso).getTime() >= limite);
  const hoje = new Date().toDateString();
  const fator = { '7dias': 1, '30dias': 4.2, trimestre: 12.5 }[periodo] ?? 1;
  const totalSessoes = Math.round(acessaram.length * 3.4 * fator);
  const [tarde, manha, noite, madrugada] = TURNOS_PERIODO[periodo] ?? TURNOS_PERIODO['7dias'];

  return responder(
    {
      periodo: { id: periodo, inicio: new Date(limite).toISOString(), fim: new Date().toISOString() },
      indicadores: {
        engajamento: Math.round((acessaram.length / ativos.length) * 100),
        metaEngajamento: 70,
        conclusaoMedia: Math.round(ativos.reduce((s, c) => s + c.progresso, 0) / ativos.length),
        satisfacao: { '7dias': 4.7, '30dias': 4.6, trimestre: 4.6 }[periodo] ?? 4.6,
      },
      atividadeRecente: {
        ativosHoje: ativos.filter((c) => c.ultimoAcesso && new Date(c.ultimoAcesso).toDateString() === hoje)
          .length,
        totalColaboradores: ativos.length,
        colaboradores: [...ativos]
          .filter((c) => c.ultimoAcesso)
          .sort((a, b) => b.ultimoAcesso.localeCompare(a.ultimoAcesso))
          .slice(0, 5)
          .map(({ id, nome, email, cargo, ultimoAcesso }) => ({ id, nome, email, cargo, ultimoAcesso })),
      },
      sessoesPorTurno: {
        total: totalSessoes,
        segmentos: [
          { turno: 'Tarde', intervalo: '12h–18h', percentual: tarde },
          { turno: 'Manhã', intervalo: '6h–12h', percentual: manha },
          { turno: 'Noite', intervalo: '18h–0h', percentual: noite },
          { turno: 'Madrugada', intervalo: '0h–6h', percentual: madrugada },
        ],
      },
    },
    500,
  );
}

// ---------------------------------------------------------------- admin: colaboradores

const filtrarColaboradores = ({ busca, status, departamento } = {}) => {
  const termo = normalizar(busca);
  return db.colaboradores
    .filter((c) => !status || status === 'todos' || c.status === status)
    .filter((c) => !departamento || c.departamento === departamento)
    .filter((c) => !termo || normalizar(`${c.nome} ${c.email} ${c.departamento} ${c.cargo}`).includes(termo))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
};

export const listarColaboradores = ({ pagina = 1, porPagina = 10, ...filtros } = {}) =>
  responder(paginar(filtrarColaboradores(filtros), pagina, porPagina));

const licencasEmUso = () => db.colaboradores.filter((c) => c.status !== 'inativo').length;

export function getResumoColaboradores() {
  const total = db.colaboradores.length;
  const ativos = db.colaboradores.filter((c) => c.status === 'ativo');
  return responder(
    {
      total,
      ativos: ativos.length,
      pendentes: db.colaboradores.filter((c) => c.status === 'pendente').length,
      inativos: db.colaboradores.filter((c) => c.status === 'inativo').length,
      conclusaoMedia: Math.round(ativos.reduce((s, c) => s + c.progresso, 0) / (ativos.length || 1)),
      licencas: { emUso: licencasEmUso(), contratadas: db.contrato.licencasContratadas },
    },
    200,
  );
}

export const getOpcoesColaboradores = () =>
  responder({ cargos: db.cargos, departamentos: db.departamentos, niveis: [1, 2, 3, 4] }, 100);

const validarColaborador = (dados, idAtual) => {
  const campos = {};
  if (!String(dados.nome ?? '').trim()) campos.nome = 'Informe o nome completo.';
  if (!emailValido(dados.email)) campos.email = 'Informe um e-mail válido.';
  else if (db.colaboradores.some((c) => c.email === dados.email.trim().toLowerCase() && c.id !== idAtual)) {
    campos.email = 'Já existe um colaborador com este e-mail.';
  }
  if (!dados.cargo) campos.cargo = 'Escolha um cargo.';
  if (!dados.departamento) campos.departamento = 'Escolha um departamento.';
  return campos;
};

export function criarColaborador(dados) {
  const campos = validarColaborador(dados);
  if (Object.keys(campos).length) return falhar(422, 'Revise os campos destacados.', { campos });
  if (licencasEmUso() >= db.contrato.licencasContratadas) {
    return falhar(409, 'Todas as licenças estão em uso. Contrate mais licenças em Plano e faturamento.', {
      codigo: 'SEM_LICENCAS',
    });
  }
  const id = proximoId(db.colaboradores);
  const novo = {
    id,
    matricula: `COL-${String(id).padStart(4, '0')}`,
    nome: dados.nome.trim(),
    email: dados.email.trim().toLowerCase(),
    cargo: dados.cargo,
    departamento: dados.departamento,
    nivel: Number(dados.nivel) || 1,
    progresso: 0,
    cursosConcluidos: 0,
    status: 'pendente',
    ultimoAcesso: null,
    criadoEm: new Date().toISOString(),
  };
  db.colaboradores.push(novo);
  return responder(novo, 500);
}

export function atualizarColaborador(id, dados) {
  const c = db.colaboradores.find((x) => x.id === Number(id));
  if (!c) return falhar(404, 'Colaborador não encontrado.');
  const campos = validarColaborador({ ...c, ...dados }, c.id);
  if (Object.keys(campos).length) return falhar(422, 'Revise os campos destacados.', { campos });
  Object.assign(c, {
    ...dados,
    email: dados.email.trim().toLowerCase(),
    nivel: Number(dados.nivel) || c.nivel,
  });
  return responder(c, 400);
}

export function alterarStatusColaborador(id, status) {
  const c = db.colaboradores.find((x) => x.id === Number(id));
  if (!c) return falhar(404, 'Colaborador não encontrado.');
  if (c.id === usuarioLogadoId && status === 'inativo') {
    return falhar(409, 'Você não pode desativar o próprio acesso.');
  }
  if (status !== 'inativo' && c.status === 'inativo' && licencasEmUso() >= db.contrato.licencasContratadas) {
    return falhar(409, 'Não há licenças livres para reativar este colaborador.', { codigo: 'SEM_LICENCAS' });
  }
  c.status = status;
  return responder(c, 400);
}

export function getProgressoColaborador(id) {
  const c = db.colaboradores.find((x) => x.id === Number(id));
  if (!c) return falhar(404, 'Colaborador não encontrado.');
  // No mock, distribui o progresso médio da pessoa entre alguns cursos.
  const cursosDaPessoa = db.cursos.slice(c.id % 5, (c.id % 5) + 4).map((curso, i) => {
    const progresso = Math.max(0, Math.min(100, c.progresso + (i - 1) * 25));
    return { curso: resumoCurso(curso), progresso, status: statusDoProgresso(progresso) };
  });
  return responder({ colaborador: c, cursos: c.status === 'pendente' ? [] : cursosDaPessoa }, 300);
}

/** Na API real: GET /admin/colaboradores/exportar (text/csv). Aqui geramos o mesmo CSV no navegador. */
export async function exportarColaboradores(filtros) {
  const linhas = filtrarColaboradores(filtros);
  const STATUS = { ativo: 'Ativo', pendente: 'Convite pendente', inativo: 'Inativo' };
  const blob = gerarCsv(linhas, [
    { titulo: 'Matrícula', valor: (c) => c.matricula },
    { titulo: 'Nome', valor: (c) => c.nome },
    { titulo: 'E-mail', valor: (c) => c.email },
    { titulo: 'Cargo', valor: (c) => c.cargo },
    { titulo: 'Departamento', valor: (c) => c.departamento },
    { titulo: 'Nível', valor: (c) => c.nivel },
    { titulo: 'Progresso (%)', valor: (c) => c.progresso },
    {
      titulo: 'Último acesso',
      valor: (c) => (c.ultimoAcesso ? new Date(c.ultimoAcesso).toLocaleString('pt-BR') : ''),
    },
    { titulo: 'Status', valor: (c) => STATUS[c.status] },
  ]);
  await responder(null, 300);
  salvarBlob(blob, `colaboradores-${new Date().toISOString().slice(0, 10)}.csv`);
  return { total: linhas.length };
}

// ---------------------------------------------------------------- admin: gestores

const montarGestor = (g) => {
  const c = db.colaboradores.find((x) => x.id === g.colaboradorId);
  return {
    ...g,
    nome: c.nome,
    email: c.email,
    departamento: c.departamento,
    ultimoAcesso: g.status === 'ativo' ? c.ultimoAcesso : null,
  };
};

const registrarAuditoria = (acao, descricao) => {
  const autor = usuarioAtual()?.nome ?? 'Sistema';
  db.auditoria.unshift({
    id: proximoId(db.auditoria),
    acao,
    descricao: `${autor} ${descricao}`,
    autor,
    criadoEm: new Date().toISOString(),
  });
};

export const listarGestores = () =>
  responder({
    gestores: db.gestores.map(montarGestor),
    papeis: db.papeis,
    candidatos: db.colaboradores
      .filter((c) => c.status !== 'inativo' && !db.gestores.some((g) => g.colaboradorId === c.id))
      .map(({ id, nome, email, departamento }) => ({ id, nome, email, departamento })),
  });

export const listarAuditoria = () => responder(db.auditoria.slice(0, 10), 250);

const nomePapel = (id) => db.papeis.find((p) => p.id === id)?.nome ?? id;

export function convidarGestor({ colaboradorId, papel }) {
  const c = db.colaboradores.find((x) => x.id === Number(colaboradorId));
  const campos = {};
  if (!c) campos.colaboradorId = 'Escolha um colaborador.';
  if (!db.papeis.some((p) => p.id === papel)) campos.papel = 'Escolha um papel.';
  if (Object.keys(campos).length) return falhar(422, 'Revise os campos destacados.', { campos });
  const gestor = {
    id: proximoId(db.gestores),
    colaboradorId: c.id,
    papel,
    mfaAtivo: false,
    status: 'pendente',
    convidadoEm: new Date().toISOString(),
  };
  db.gestores.push(gestor);
  registrarAuditoria('Convite enviado', `convidou ${c.nome} como ${nomePapel(papel)}.`);
  return responder(montarGestor(gestor), 500);
}

const quantidadeAdmins = () => db.gestores.filter((g) => g.papel === 'admin' && g.status === 'ativo').length;

export function alterarPapelGestor(id, papel) {
  const g = db.gestores.find((x) => x.id === Number(id));
  if (!g) return falhar(404, 'Gestor não encontrado.');
  if (g.papel === 'admin' && papel !== 'admin' && quantidadeAdmins() <= 1) {
    return falhar(409, 'A empresa precisa de pelo menos um Administrador ativo.');
  }
  g.papel = papel;
  registrarAuditoria('Permissão alterada', `definiu ${montarGestor(g).nome} como ${nomePapel(papel)}.`);
  return responder(montarGestor(g), 400);
}

export function revogarGestor(id) {
  const indice = db.gestores.findIndex((x) => x.id === Number(id));
  if (indice < 0) return falhar(404, 'Gestor não encontrado.');
  const g = db.gestores[indice];
  if (g.colaboradorId === usuarioLogadoId) return falhar(409, 'Você não pode revogar o próprio acesso.');
  if (g.papel === 'admin' && quantidadeAdmins() <= 1) {
    return falhar(409, 'A empresa precisa de pelo menos um Administrador ativo.');
  }
  const nome = montarGestor(g).nome;
  db.gestores.splice(indice, 1);
  registrarAuditoria('Acesso revogado', `revogou o acesso administrativo de ${nome}.`);
  return responder(null, 400);
}

export function reenviarConvite(id) {
  const g = db.gestores.find((x) => x.id === Number(id));
  if (!g) return falhar(404, 'Gestor não encontrado.');
  g.convidadoEm = new Date().toISOString();
  registrarAuditoria('Convite reenviado', `reenviou o convite de ${montarGestor(g).nome}.`);
  return responder(montarGestor(g), 400);
}

// ---------------------------------------------------------------- admin: relatórios

const montarRelatorio = (r) => ({ ...r, modelo: db.modelosRelatorio.find((m) => m.id === r.modeloId) });

export const getRelatorios = () =>
  responder({
    modelos: db.modelosRelatorio,
    departamentos: db.departamentos,
    historico: [...db.relatoriosGerados]
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
      .map(montarRelatorio),
  });

export function gerarRelatorio({ modeloId, periodo, departamento }) {
  if (!db.modelosRelatorio.some((m) => m.id === modeloId))
    return falhar(422, 'Modelo de relatório inválido.');
  const relatorio = {
    id: proximoId(db.relatoriosGerados),
    modeloId,
    periodo,
    departamento: departamento || null,
    status: 'processando',
    solicitadoPor: usuarioAtual()?.nome ?? '—',
    criadoEm: new Date().toISOString(),
    url: null,
  };
  db.relatoriosGerados.push(relatorio);
  // Simula o processamento assíncrono no servidor.
  setTimeout(() => (relatorio.status = 'pronto'), 3000);
  return responder(montarRelatorio(relatorio), 400);
}

// ---------------------------------------------------------------- admin: faturamento

const proximoVencimento = () => {
  const d = new Date();
  d.setDate(15);
  if (d <= new Date()) d.setMonth(d.getMonth() + 1);
  return d.toISOString();
};

export const getFaturamento = () =>
  responder({
    contrato: db.contrato,
    licencas: { contratadas: db.contrato.licencasContratadas, emUso: licencasEmUso() },
    proximaFatura: {
      vencimento: proximoVencimento(),
      valorCentavos: db.contrato.licencasContratadas * db.contrato.valorLicencaMensalCentavos,
    },
    dadosFiscais: {
      razaoSocial: db.configuracoes.organizacao.razaoSocial,
      cnpj: db.configuracoes.organizacao.cnpj,
      endereco: db.empresa.endereco,
    },
    faturas: db.faturas,
  });

export function contratarLicencas(quantidade) {
  const qtd = Number(quantidade);
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 500) {
    return falhar(422, 'Informe uma quantidade entre 1 e 500.', { campos: { quantidade: 'Entre 1 e 500.' } });
  }
  db.contrato.licencasContratadas += qtd;
  return responder({ licencasContratadas: db.contrato.licencasContratadas }, 700);
}

// ---------------------------------------------------------------- admin: configurações

export const getConfiguracoes = () => responder(db.configuracoes);

export function salvarConfiguracoes(config) {
  const campos = {};
  const org = config.organizacao ?? {};
  if (!String(org.nomeFantasia ?? '').trim()) campos.nomeFantasia = 'Informe o nome fantasia.';
  if (!String(org.razaoSocial ?? '').trim()) campos.razaoSocial = 'Informe a razão social.';
  if (!cnpjValido(org.cnpj)) campos.cnpj = 'CNPJ inválido. Confira os 14 dígitos.';
  if (!emailValido(org.emailNotificacao)) campos.emailNotificacao = 'Informe um e-mail válido.';
  if (Object.keys(campos).length) return falhar(422, 'Revise os campos destacados.', { campos });
  db.configuracoes.organizacao = { ...org };
  db.configuracoes.politicas = { ...config.politicas };
  db.empresa.nomeFantasia = org.nomeFantasia;
  return responder(db.configuracoes, 600);
}
