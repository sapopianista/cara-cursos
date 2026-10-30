/**
 * BANCO SIMULADO (somente com VITE_USAR_MOCK=true).
 *
 * Um único conjunto de dados coerente, MUTÁVEL durante a sessão, para que as
 * telas se comportem como se houvesse um backend: o que é criado aparece nas
 * listas, métricas são calculadas a partir dos registros e as datas são
 * relativas a "agora" (nunca ficam velhas).
 *
 * Os formatos aqui são os mesmos que o backend Java deve devolver
 * (ver docs/API.md): datas em ISO 8601, durações em minutos/segundos,
 * dinheiro em centavos, enums em minúsculas.
 */

const agora = () => new Date();
/** ISO de "agora menos X". */
export const atras = ({ dias = 0, horas = 0, minutos = 0 } = {}) =>
  new Date(agora().getTime() - ((dias * 24 + horas) * 60 + minutos) * 60_000).toISOString();
/** ISO de "agora mais X dias" (prazos, vencimentos). */
export const daqui = (dias) => new Date(agora().getTime() + dias * 86_400_000).toISOString();

/** Vídeo de demonstração (domínio público, CC0) usado por todas as aulas no mock. */
const VIDEO_DEMO = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

// ---------------------------------------------------------------- Empresa

export const empresa = {
  id: 1,
  nomeFantasia: 'Oscorp',
  razaoSocial: 'Oscorp Brasil Ltda.',
  cnpj: '11.222.333/0001-81',
  endereco: 'Av. Paulista, 1842, Bela Vista — São Paulo, SP',
};

// ---------------------------------------------------------------- Catálogo

export const categorias = [
  { id: 'comunicacao', nome: 'Comunicação' },
  { id: 'lideranca', nome: 'Liderança e Gestão' },
  { id: 'dados', nome: 'Dados e Análise' },
  { id: 'produtividade', nome: 'Produtividade' },
  { id: 'desenvolvimento-humano', nome: 'Desenvolvimento Humano' },
  { id: 'tecnologia', nome: 'Tecnologia' },
  { id: 'conformidade', nome: 'Conformidade' },
];

export const areas = [
  {
    id: 'tecnologia',
    nome: 'Tecnologia e Engenharia',
    icone: 'code',
    competencias: ['Front-end', 'DevOps', 'Cloud', 'IA aplicada'],
  },
  {
    id: 'lideranca',
    nome: 'Liderança e Estratégia',
    icone: 'users',
    competencias: ['Gestão de pessoas', 'OKRs', 'Feedback', 'Cultura ágil'],
  },
  {
    id: 'rh',
    nome: 'Recursos Humanos',
    icone: 'heart',
    competencias: ['People analytics', 'Recrutamento', 'Clima', 'Diversidade'],
  },
  {
    id: 'vendas',
    nome: 'Vendas e Negociação',
    icone: 'trending',
    competencias: ['Negociação', 'CRM', 'B2B', 'Relacionamento'],
  },
  {
    id: 'financas',
    nome: 'Finanças e Controladoria',
    icone: 'building',
    competencias: ['Orçamento', 'Excel', 'Indicadores', 'Compliance'],
  },
  {
    id: 'marketing',
    nome: 'Marketing e Crescimento',
    icone: 'megaphone',
    competencias: ['Posicionamento', 'Conteúdo', 'Mídia paga', 'SEO'],
  },
  {
    id: 'design',
    nome: 'Design e Experiência',
    icone: 'pen',
    competencias: ['Pesquisa', 'Figma', 'Design system', 'Acessibilidade'],
  },
  {
    id: 'operacoes',
    nome: 'Operações e Processos',
    icone: 'boxes',
    competencias: ['Lean', 'Processos', 'Riscos', 'Logística'],
  },
];

const curso = (dados) => ({
  imagemUrl: null,
  destaque: false,
  lancamento: false,
  ...dados,
});

export const cursos = [
  curso({
    id: 1,
    titulo: 'Comunicação Assertiva no Trabalho',
    descricao: 'Comunique-se com clareza, empatia e objetividade com colegas, gestores e clientes.',
    categoriaId: 'comunicacao',
    areaId: 'lideranca',
    nivel: 'intermediario',
    duracaoMinutos: 120,
    totalAulas: 7,
    nota: 4.9,
    totalAvaliacoes: 320,
    instrutor: { nome: 'Carla Lima', cargo: 'Especialista em Comunicação Corporativa' },
    tema: 'azul',
    destaque: true,
  }),
  curso({
    id: 2,
    titulo: 'Gestão do Tempo e Prioridades',
    descricao: 'Técnicas práticas para priorizar, reduzir interrupções e manter rotinas de alta entrega.',
    categoriaId: 'produtividade',
    areaId: 'operacoes',
    nivel: 'iniciante',
    duracaoMinutos: 90,
    totalAulas: 6,
    nota: 4.8,
    totalAvaliacoes: 412,
    instrutor: { nome: 'Marcos Silva', cargo: 'Consultor de Produtividade' },
    tema: 'ambar',
    lancamento: true,
  }),
  curso({
    id: 3,
    titulo: 'Resolução de Problemas e Tomada de Decisão',
    descricao: 'Estruture hipóteses, analise cenários e decida com base em evidências.',
    categoriaId: 'lideranca',
    areaId: 'lideranca',
    nivel: 'avancado',
    duracaoMinutos: 120,
    totalAulas: 8,
    nota: 4.9,
    totalAvaliacoes: 189,
    instrutor: { nome: 'Renata Neves', cargo: 'Doutora em Gestão' },
    tema: 'roxo',
    destaque: true,
  }),
  curso({
    id: 4,
    titulo: 'Excel para o Dia a Dia',
    descricao: 'O essencial de planilhas para organizar dados, montar relatórios e automatizar tarefas.',
    categoriaId: 'dados',
    areaId: 'financas',
    nivel: 'iniciante',
    duracaoMinutos: 180,
    totalAulas: 10,
    nota: 4.7,
    totalAvaliacoes: 540,
    instrutor: { nome: 'Felipe Alves', cargo: 'Analista de BI' },
    tema: 'ciano',
  }),
  curso({
    id: 5,
    titulo: 'Liderança Situacional e Feedback',
    descricao: 'Adapte seu estilo de liderança, conduza 1:1 e dê feedbacks que geram mudança.',
    categoriaId: 'lideranca',
    areaId: 'rh',
    nivel: 'intermediario',
    duracaoMinutos: 240,
    totalAulas: 12,
    nota: 5.0,
    totalAvaliacoes: 186,
    instrutor: { nome: 'Beatriz Albuquerque', cargo: 'Coordenadora de RH' },
    tema: 'teal',
    destaque: true,
  }),
  curso({
    id: 6,
    titulo: 'Inteligência Emocional no Trabalho',
    descricao: 'Autoconhecimento, autorregulação sob pressão e resiliência no dia a dia.',
    categoriaId: 'desenvolvimento-humano',
    areaId: 'rh',
    nivel: 'todos',
    duracaoMinutos: 120,
    totalAulas: 6,
    nota: 4.8,
    totalAvaliacoes: 152,
    instrutor: { nome: 'Paula Moreira', cargo: 'Psicóloga Organizacional' },
    tema: 'rosa',
    lancamento: true,
  }),
  curso({
    id: 7,
    titulo: 'Excel Avançado e Dashboards',
    descricao: 'Tabelas dinâmicas, PROCX, Power Query e dashboards gerenciais.',
    categoriaId: 'dados',
    areaId: 'financas',
    nivel: 'avancado',
    duracaoMinutos: 300,
    totalAulas: 14,
    nota: 4.9,
    totalAvaliacoes: 310,
    instrutor: { nome: 'Felipe Alves', cargo: 'Analista de BI' },
    tema: 'grafite',
  }),
  curso({
    id: 8,
    titulo: 'Gestão de Conflitos',
    descricao: 'Transforme divergências em colaboração com técnicas estruturadas de mediação.',
    categoriaId: 'desenvolvimento-humano',
    areaId: 'vendas',
    nivel: 'intermediario',
    duracaoMinutos: 150,
    totalAulas: 8,
    nota: 4.6,
    totalAvaliacoes: 77,
    instrutor: { nome: 'Paula Moreira', cargo: 'Psicóloga Organizacional' },
    tema: 'laranja',
  }),
  curso({
    id: 9,
    titulo: 'Apresentações de Alto Impacto',
    descricao: 'Storytelling, slides limpos e oratória para reuniões decisivas.',
    categoriaId: 'comunicacao',
    areaId: 'marketing',
    nivel: 'intermediario',
    duracaoMinutos: 180,
    totalAulas: 9,
    nota: 4.9,
    totalAvaliacoes: 244,
    instrutor: { nome: 'Carla Lima', cargo: 'Especialista em Comunicação Corporativa' },
    tema: 'azul',
  }),
  curso({
    id: 10,
    titulo: 'Fundamentos da Cultura Oscorp',
    descricao: 'Valores, ferramentas internas e rotinas para começar com o pé direito.',
    categoriaId: 'conformidade',
    areaId: 'rh',
    nivel: 'iniciante',
    duracaoMinutos: 60,
    totalAulas: 5,
    nota: 4.7,
    totalAvaliacoes: 890,
    instrutor: { nome: 'Beatriz Albuquerque', cargo: 'Coordenadora de RH' },
    tema: 'verde',
  }),
  curso({
    id: 11,
    titulo: 'Segurança da Informação e LGPD',
    descricao: 'Proteja dados, reconheça engenharia social e cumpra a legislação.',
    categoriaId: 'conformidade',
    areaId: 'tecnologia',
    nivel: 'todos',
    duracaoMinutos: 120,
    totalAulas: 6,
    nota: 4.9,
    totalAvaliacoes: 615,
    instrutor: { nome: 'Rafael Costa', cargo: 'Especialista em Segurança' },
    tema: 'grafite',
    destaque: true,
  }),
  curso({
    id: 12,
    titulo: 'IA Generativa para Produtividade',
    descricao: 'Use ferramentas de IA para automatizar relatórios, análises e rotinas.',
    categoriaId: 'tecnologia',
    areaId: 'tecnologia',
    nivel: 'intermediario',
    duracaoMinutos: 360,
    totalAulas: 12,
    nota: 5.0,
    totalAvaliacoes: 98,
    instrutor: { nome: 'Roberto Guimarães', cargo: 'Pesquisador em IA' },
    tema: 'roxo',
    destaque: true,
    lancamento: true,
  }),
  curso({
    id: 13,
    titulo: 'Metodologias Ágeis: Scrum e Kanban',
    descricao: 'Rituais ágeis, gestão de gargalos e fluxo contínuo em equipes dinâmicas.',
    categoriaId: 'produtividade',
    areaId: 'operacoes',
    nivel: 'intermediario',
    duracaoMinutos: 180,
    totalAulas: 9,
    nota: 4.8,
    totalAvaliacoes: 201,
    instrutor: { nome: 'Marcos Silva', cargo: 'Consultor de Produtividade' },
    tema: 'teal',
  }),
  curso({
    id: 14,
    titulo: 'Negociação e Influência',
    descricao: 'Estratégias de alinhamento entre áreas, concessões e construção de consenso.',
    categoriaId: 'comunicacao',
    areaId: 'vendas',
    nivel: 'avancado',
    duracaoMinutos: 190,
    totalAulas: 10,
    nota: 4.7,
    totalAvaliacoes: 133,
    instrutor: { nome: 'Carla Lima', cargo: 'Especialista em Comunicação Corporativa' },
    tema: 'laranja',
  }),
  curso({
    id: 15,
    titulo: 'Pesquisa com Usuários',
    descricao: 'Entrevistas, testes de usabilidade e síntese de descobertas para produto.',
    categoriaId: 'tecnologia',
    areaId: 'design',
    nivel: 'intermediario',
    duracaoMinutos: 150,
    totalAulas: 8,
    nota: 4.8,
    totalAvaliacoes: 64,
    instrutor: { nome: 'Camila Rocha', cargo: 'Designer UI/UX' },
    tema: 'rosa',
    lancamento: true,
  }),
  curso({
    id: 16,
    titulo: 'Posicionamento de Marca',
    descricao: 'Proposta de valor, mensagens-chave e consistência em todos os canais.',
    categoriaId: 'comunicacao',
    areaId: 'marketing',
    nivel: 'intermediario',
    duracaoMinutos: 140,
    totalAulas: 7,
    nota: 4.6,
    totalAvaliacoes: 58,
    instrutor: { nome: 'Lucas Prado', cargo: 'Head de Marketing' },
    tema: 'ambar',
  }),
];

export const destaqueDoMesId = 12;

// ---------------------------------------------------------------- Aulas

const TITULOS_AULA = {
  1: [
    'Introdução',
    'O que é comunicação assertiva',
    'Técnicas de comunicação assertiva',
    'Barreiras da comunicação',
    'Benefícios da comunicação aberta',
    'Como evitar conflitos na equipe',
    'Simulação prática',
  ],
};
const TITULOS_GENERICOS = [
  'Introdução e objetivos',
  'Conceitos fundamentais',
  'Ferramentas na prática',
  'Estudo de caso',
  'Erros comuns e como evitar',
  'Aplicando no seu contexto',
  'Exercício guiado',
  'Aprofundamento',
  'Boas práticas',
  'Revisão do módulo',
  'Projeto aplicado',
  'Próximos passos',
  'Desafio final',
  'Encerramento',
];

/** Progresso (0–100) de cada curso para o usuário logado. */
export const progressoCursos = { 1: 42, 2: 30, 4: 85, 7: 12, 10: 100, 11: 100, 13: 100 };

const gerarAulas = (c) => {
  const titulos = TITULOS_AULA[c.id] ?? TITULOS_GENERICOS.slice(0, c.totalAulas);
  const concluidas = Math.floor((titulos.length * (progressoCursos[c.id] ?? 0)) / 100);
  const mediaSegundos = Math.round((c.duracaoMinutos * 60) / titulos.length);
  return titulos.map((titulo, i) => {
    const duracaoSegundos = Math.max(180, mediaSegundos + ((i * 97) % 240) - 120);
    const emAndamento = i === concluidas && Boolean(progressoCursos[c.id]);
    return {
      id: c.id * 100 + i + 1,
      ordem: i + 1,
      titulo,
      tipo: i === titulos.length - 1 && titulos.length > 4 ? 'avaliacao' : 'video',
      duracaoSegundos,
      status: i < concluidas ? 'concluida' : emAndamento ? 'em_andamento' : 'pendente',
      posicaoSegundos: emAndamento ? Math.round(duracaoSegundos * 0.4) : 0,
      videoUrl: VIDEO_DEMO,
    };
  });
};

export const aulasPorCurso = Object.fromEntries(cursos.map((c) => [c.id, gerarAulas(c)]));

export const materiaisPorCurso = {
  1: [
    { id: 1, nome: 'Guia de comunicação assertiva.pdf', tamanhoBytes: 1_480_000, url: null },
    { id: 2, nome: 'Roteiro de feedback.docx', tamanhoBytes: 86_000, url: null },
  ],
  4: [{ id: 3, nome: 'Planilhas de exercício.xlsx', tamanhoBytes: 320_000, url: null }],
};

export const atividades = [
  {
    id: 1,
    cursoId: 2,
    titulo: 'Aplicar a Matriz de Eisenhower na sua semana',
    descricao: 'Monte um cronograma semanal priorizando tarefas urgentes e importantes.',
    prazo: daqui(2),
    status: 'pendente',
  },
  {
    id: 2,
    cursoId: 1,
    titulo: 'Simulação de feedback construtivo',
    descricao: 'Redija uma resposta objetiva para alinhar expectativas usando Comunicação Não-Violenta.',
    prazo: daqui(3),
    status: 'pendente',
  },
  {
    id: 3,
    cursoId: 4,
    titulo: 'Relatório mensal com tabela dinâmica',
    descricao: 'Use a planilha de exercício para montar um resumo de vendas por região.',
    prazo: daqui(6),
    status: 'pendente',
  },
];

// ---------------------------------------------------------------- Trilhas e níveis

export const trilhas = [
  {
    id: 1,
    titulo: 'Comunicação e Influência',
    descricao:
      'Da conversa do dia a dia às apresentações decisivas: comunique com clareza e conquiste apoio.',
    nivel: 'intermediario',
    tema: 'azul',
    competencias: ['Assertividade', 'Oratória', 'Negociação'],
    cursoIds: [1, 9, 14, 8],
  },
  {
    id: 2,
    titulo: 'Liderança de Equipes',
    descricao: 'Para quem lidera ou vai liderar: feedback, decisões e desenvolvimento de pessoas.',
    nivel: 'avancado',
    tema: 'teal',
    competencias: ['Feedback', 'Decisão', 'Inteligência emocional'],
    cursoIds: [5, 3, 6, 8],
  },
  {
    id: 3,
    titulo: 'Dados para Decisão',
    descricao: 'Do Excel básico aos dashboards gerenciais, com IA para acelerar análises.',
    nivel: 'intermediario',
    tema: 'ciano',
    competencias: ['Excel', 'Dashboards', 'IA aplicada'],
    cursoIds: [4, 7, 12],
  },
  {
    id: 4,
    titulo: 'Integração Oscorp',
    descricao: 'Trilha obrigatória de boas-vindas: cultura, segurança e ferramentas.',
    nivel: 'iniciante',
    tema: 'verde',
    competencias: ['Cultura', 'LGPD', 'Produtividade'],
    cursoIds: [10, 11, 13],
  },
];

export const niveis = [
  {
    id: 1,
    ordem: 1,
    titulo: 'Fundamentos e Integração',
    perfil: 'Iniciante',
    competencias: ['Cultura da empresa', 'Ferramentas de trabalho', 'Segurança da informação'],
    cursoIds: [10, 11, 13],
  },
  {
    id: 2,
    ordem: 2,
    titulo: 'Execução e Produtividade',
    perfil: 'Intermediário',
    competencias: ['Gestão do tempo', 'Excel e dados', 'Comunicação'],
    cursoIds: [1, 2, 4, 7],
  },
  {
    id: 3,
    ordem: 3,
    titulo: 'Especialização e Autonomia',
    perfil: 'Avançado',
    competencias: ['Resolução de problemas', 'Negociação', 'Apresentações'],
    cursoIds: [3, 9, 14, 12],
  },
  {
    id: 4,
    ordem: 4,
    titulo: 'Liderança e Estratégia',
    perfil: 'Sênior / Gestão',
    competencias: ['Liderança situacional', 'Gestão de conflitos', 'Inteligência emocional'],
    cursoIds: [5, 6, 8],
  },
];

export const certificados = [
  {
    id: 1,
    titulo: 'Fundamentos e Integração',
    origem: 'Nível 1',
    emitidoEm: atras({ dias: 120 }),
    codigo: 'CC-9482-OSC',
    url: null,
  },
  {
    id: 2,
    titulo: 'Segurança da Informação e LGPD',
    origem: 'Curso',
    emitidoEm: atras({ dias: 95 }),
    codigo: 'CC-7393-LGP',
    url: null,
  },
  {
    id: 3,
    titulo: 'Metodologias Ágeis: Scrum e Kanban',
    origem: 'Curso',
    emitidoEm: atras({ dias: 40 }),
    codigo: 'CC-8821-AGI',
    url: null,
  },
];

// ---------------------------------------------------------------- Pessoas

const NOMES = [
  ['Tiago Vieira', 'Analista de Operações', 'Operações', 3],
  ['Ana Clara Silveira', 'Assistente de RH', 'Recursos Humanos', 2],
  ['Beatriz Albuquerque', 'Coordenadora de RH', 'Recursos Humanos', 4],
  ['Juliana Mendonça', 'Gerente de Projetos', 'Operações', 4],
  ['Rodrigo Caetano', 'Analista Financeiro', 'Financeiro', 2],
  ['Matheus Alencar', 'Estagiário', 'Tecnologia', 1],
  ['Maria Eduarda Santos', 'Auxiliar Administrativo', 'Financeiro', 1],
  ['Marcos Vinícius Lima', 'Técnico de Manutenção', 'Manutenção', 2],
  ['Camila Rocha', 'Designer UI/UX', 'Produto', 3],
  ['Felipe Barreto', 'Desenvolvedor Front-end', 'Tecnologia', 2],
  ['Lucas Prado', 'Head de Marketing', 'Marketing', 4],
  ['Patrícia Gomes', 'Analista de Marketing', 'Marketing', 2],
  ['Rafael Costa', 'Especialista em Segurança', 'Tecnologia', 3],
  ['Larissa Nunes', 'Analista de Dados', 'Tecnologia', 2],
  ['Gustavo Henrique', 'Comprador', 'Operações', 1],
  ['Fernanda Ribeiro', 'Analista de Produto', 'Produto', 2],
  ['Diego Martins', 'Supervisor de Logística', 'Operações', 3],
  ['Aline Carvalho', 'Analista Contábil', 'Financeiro', 2],
  ['Bruno Teixeira', 'Desenvolvedor Back-end', 'Tecnologia', 3],
  ['Carolina Duarte', 'Recrutadora', 'Recursos Humanos', 2],
  ['Eduardo Pires', 'Técnico de Manutenção', 'Manutenção', 1],
  ['Helena Castro', 'Product Manager', 'Produto', 4],
  ['Igor Fernandes', 'Estagiário', 'Marketing', 1],
  ['Vanessa Lopes', 'Analista de Operações', 'Operações', 2],
];

const emailDe = (nome) =>
  nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(' ')
    .filter((_, i, partes) => i === 0 || i === partes.length - 1)
    .join('.') + '@oscorp.com';

const STATUS_CICLO = [
  'ativo',
  'ativo',
  'ativo',
  'ativo',
  'ativo',
  'ativo',
  'pendente',
  'ativo',
  'ativo',
  'inativo',
];

export const colaboradores = NOMES.map(([nome, cargo, departamento, nivel], i) => {
  const status = i < 4 ? 'ativo' : STATUS_CICLO[i % STATUS_CICLO.length];
  return {
    id: 101 + i,
    matricula: `COL-${String(101 + i).padStart(4, '0')}`,
    nome,
    email: emailDe(nome),
    cargo,
    departamento,
    nivel,
    progresso: status === 'pendente' ? 0 : (i * 37 + 18) % 101,
    cursosConcluidos: status === 'pendente' ? 0 : (i * 3) % 9,
    status,
    ultimoAcesso:
      status === 'pendente'
        ? null
        : atras({ dias: i < 6 ? 0 : (i * 5) % 40, horas: (i * 3) % 9, minutos: (i * 13) % 60 }),
    criadoEm: atras({ dias: 400 - i * 11 }),
  };
});

export const departamentos = [
  'Financeiro',
  'Manutenção',
  'Marketing',
  'Operações',
  'Produto',
  'Recursos Humanos',
  'Tecnologia',
];
export const cargos = [...new Set(NOMES.map((n) => n[1]))].sort((a, b) => a.localeCompare(b, 'pt-BR'));

/** Papéis administrativos. `colaborador` = só a área do aluno. */
export const papeis = [
  { id: 'admin', nome: 'Administrador', descricao: 'Acesso total, incluindo faturamento e permissões.' },
  {
    id: 'rh',
    nome: 'Gestor de RH',
    descricao: 'Gerencia colaboradores, relatórios e configurações de aprendizagem.',
  },
  { id: 'lider', nome: 'Líder de equipe', descricao: 'Acompanha o progresso das pessoas da sua equipe.' },
  { id: 'financeiro', nome: 'Financeiro', descricao: 'Acessa faturas, notas fiscais e licenças.' },
];

const colab = (nome) => colaboradores.find((c) => c.nome === nome);

export const gestores = [
  { colaboradorId: colab('Tiago Vieira').id, papel: 'admin', mfaAtivo: true, status: 'ativo' },
  { colaboradorId: colab('Beatriz Albuquerque').id, papel: 'rh', mfaAtivo: true, status: 'ativo' },
  { colaboradorId: colab('Juliana Mendonça').id, papel: 'lider', mfaAtivo: true, status: 'ativo' },
  { colaboradorId: colab('Lucas Prado').id, papel: 'lider', mfaAtivo: false, status: 'ativo' },
  { colaboradorId: colab('Rodrigo Caetano').id, papel: 'financeiro', mfaAtivo: false, status: 'pendente' },
].map((g, i) => ({ id: i + 1, ...g, convidadoEm: atras({ dias: 200 - i * 30 }) }));

export const auditoria = [
  {
    id: 1,
    acao: 'Certificado SSO renovado',
    descricao: 'Tiago Vieira fez a rotação do certificado SAML.',
    autor: 'Tiago Vieira',
    criadoEm: atras({ horas: 2 }),
  },
  {
    id: 2,
    acao: 'Permissão alterada',
    descricao: 'Beatriz Albuquerque definiu Juliana Mendonça como Líder de equipe.',
    autor: 'Beatriz Albuquerque',
    criadoEm: atras({ horas: 6 }),
  },
  {
    id: 3,
    acao: 'Convite enviado',
    descricao: 'Tiago Vieira convidou Rodrigo Caetano como Financeiro.',
    autor: 'Tiago Vieira',
    criadoEm: atras({ dias: 1, horas: 3 }),
  },
];

/** Contas que entram no login de demonstração (senha: qualquer, com 6+ caracteres). */
export const contasDemo = [
  { email: 'tiago.vieira@oscorp.com', descricao: 'Administrador (área do aluno + painel RH)' },
  { email: 'ana.silveira@oscorp.com', descricao: 'Colaborador (somente área do aluno)' },
];

export const preferenciasPorUsuario = {};

// ---------------------------------------------------------------- Suporte e notificações

export const faq = {
  aluno: [
    {
      id: 1,
      pergunta: 'Como emito meu certificado?',
      resposta:
        'Ao concluir todas as aulas e atingir nota mínima 7,0 nas avaliações, o certificado aparece em Meu progresso → Certificados.',
    },
    {
      id: 2,
      pergunta: 'Posso refazer uma avaliação?',
      resposta: 'Sim, até 3 tentativas por módulo. Revise o material de apoio antes de tentar novamente.',
    },
    {
      id: 3,
      pergunta: 'Minhas horas aparecem para o RH?',
      resposta: 'Sim. Cada curso concluído é sincronizado com o RH em até 24 horas úteis.',
    },
    {
      id: 4,
      pergunta: 'O vídeo está travando. O que faço?',
      resposta:
        'Reduza a qualidade no menu do player. Se continuar, abra um chamado informando o horário e o curso.',
    },
  ],
  gestor: [
    {
      id: 11,
      pergunta: 'Como gero o relatório de horas de treinamento?',
      resposta:
        'Em Relatórios, escolha "Conclusão de cursos e trilhas", defina o período e clique em Gerar. O arquivo fica disponível no histórico.',
    },
    {
      id: 12,
      pergunta: 'Como exporto a lista de colaboradores?',
      resposta:
        'Em Colaboradores, aplique os filtros desejados e use "Exportar CSV". O arquivo respeita a busca e o status selecionados.',
    },
    {
      id: 13,
      pergunta: 'Como revogo o acesso de alguém desligado?',
      resposta:
        'Em Colaboradores, abra o menu da pessoa e escolha "Desativar". O histórico de certificados é preservado. Se ela também for gestora, revogue o acesso em Gestores e permissões.',
    },
    {
      id: 14,
      pergunta: 'Como exijo 2FA para gestores?',
      resposta: 'Em Configurações → Segurança, ative "Exigir autenticação em duas etapas" e salve.',
    },
  ],
};

export const contatoSuporte = {
  aluno: {
    canal: 'Equipe pedagógica e técnica',
    tempoResposta: 'Resposta em até 2 horas úteis, no seu e-mail corporativo.',
  },
  gestor: {
    canal: 'Gerente de sucesso dedicado',
    nome: 'Camila Fontes',
    email: 'camila.fontes@caracursos.com.br',
    tempoResposta: 'Segunda a sexta, das 9h às 18h. Resposta em até 1 hora útil.',
  },
};

export const assuntosChamado = {
  aluno: ['Dúvida sobre o conteúdo', 'Problema técnico com vídeo', 'Certificado', 'Outro assunto'],
  gestor: ['Trilhas e cursos', 'Faturamento e licenças', 'Integrações e API', 'Segurança e LGPD'],
};

export const chamados = [
  {
    id: 4109,
    escopo: 'aluno',
    assunto: 'Dúvida sobre o conteúdo',
    titulo: 'Exercício prático do módulo 2',
    cursoId: 1,
    status: 'respondido',
    atualizadoEm: atras({ dias: 1 }),
  },
  {
    id: 3984,
    escopo: 'aluno',
    assunto: 'Certificado',
    titulo: 'Validação de certificado de conclusão',
    cursoId: 11,
    status: 'resolvido',
    atualizadoEm: atras({ dias: 20 }),
  },
  {
    id: 8492,
    escopo: 'gestor',
    assunto: 'Integrações e API',
    titulo: 'Webhook de conclusão de curso',
    cursoId: null,
    status: 'em_analise',
    atualizadoEm: atras({ horas: 3 }),
  },
  {
    id: 8120,
    escopo: 'gestor',
    assunto: 'Faturamento e licenças',
    titulo: 'Liberação de licenças para Tecnologia',
    cursoId: null,
    status: 'resolvido',
    atualizadoEm: atras({ dias: 12 }),
  },
];

export const notificacoes = [
  {
    id: 1,
    titulo: 'Atividade vence em 2 dias',
    descricao: 'Aplicar a Matriz de Eisenhower na sua semana',
    link: '/cursos/2',
    lida: false,
    criadaEm: atras({ horas: 1 }),
  },
  {
    id: 2,
    titulo: 'Novo curso em destaque',
    descricao: 'IA Generativa para Produtividade já está disponível.',
    link: '/cursos/12',
    lida: false,
    criadaEm: atras({ dias: 1 }),
  },
  {
    id: 3,
    titulo: 'Chamado respondido',
    descricao: 'A equipe respondeu o chamado #4109.',
    link: '/suporte',
    lida: true,
    criadaEm: atras({ dias: 2 }),
  },
];

// ---------------------------------------------------------------- Relatórios, faturamento e configurações

export const modelosRelatorio = [
  {
    id: 'engajamento',
    titulo: 'Engajamento e frequência',
    descricao: 'Dias e horários de maior acesso, tempo médio por sessão e colaboradores ativos.',
    formato: 'xlsx',
  },
  {
    id: 'conclusao',
    titulo: 'Conclusão de cursos e trilhas',
    descricao: 'Percentual de conclusão por departamento e tempo médio até concluir.',
    formato: 'pdf',
  },
  {
    id: 'investimento',
    titulo: 'Investimento e retorno',
    descricao: 'Custo por colaborador capacitado e horas acumuladas por departamento.',
    formato: 'pdf',
  },
  {
    id: 'satisfacao',
    titulo: 'Avaliações e satisfação',
    descricao: 'Notas das aulas, avaliação dos instrutores e comentários dos alunos.',
    formato: 'csv',
  },
  {
    id: 'individual',
    titulo: 'Desempenho individual',
    descricao: 'Cursos concluídos, certificados e assiduidade de cada colaborador.',
    formato: 'pdf',
  },
  {
    id: 'conformidade',
    titulo: 'Conformidade e LGPD',
    descricao: 'Treinamentos obrigatórios concluídos e pendências por equipe.',
    formato: 'csv',
  },
];

export const relatoriosGerados = [
  {
    id: 101,
    modeloId: 'engajamento',
    periodo: '30dias',
    departamento: null,
    status: 'pronto',
    solicitadoPor: 'Beatriz Albuquerque',
    criadoEm: atras({ horas: 4 }),
    url: null,
  },
  {
    id: 102,
    modeloId: 'conformidade',
    periodo: 'trimestre',
    departamento: 'Tecnologia',
    status: 'pronto',
    solicitadoPor: 'Tiago Vieira',
    criadoEm: atras({ dias: 1, horas: 2 }),
    url: null,
  },
  {
    id: 103,
    modeloId: 'investimento',
    periodo: 'ano',
    departamento: null,
    status: 'pronto',
    solicitadoPor: 'Rodrigo Caetano',
    criadoEm: atras({ dias: 9 }),
    url: null,
  },
];

export const contrato = {
  numero: 'OSC-2026-008',
  plano: 'Enterprise anual',
  status: 'ativo',
  inicio: atras({ dias: 320 }),
  renovacao: daqui(45),
  licencasContratadas: 30,
  valorLicencaMensalCentavos: 7400,
  metodoPagamento: 'Boleto bancário',
  emailNotaFiscal: 'nfe@oscorp.com',
};

const mesAnterior = (n) => {
  const d = new Date();
  d.setDate(15);
  d.setMonth(d.getMonth() - n);
  return d;
};

export const faturas = [0, 1, 2, 3].map((n) => {
  const emissao = mesAnterior(n);
  return {
    id: `INV-${emissao.getFullYear()}-${String(emissao.getMonth() + 1).padStart(2, '0')}`,
    competencia: emissao.toISOString(),
    licencas: n >= 2 ? 25 : 30,
    valorCentavos: (n >= 2 ? 25 : 30) * contrato.valorLicencaMensalCentavos,
    emitidaEm: emissao.toISOString(),
    status: 'paga',
    notaFiscal: { numero: `NFE-${90420 - n * 37}`, url: null },
  };
});

export const configuracoes = {
  organizacao: {
    nomeFantasia: empresa.nomeFantasia,
    razaoSocial: empresa.razaoSocial,
    cnpj: empresa.cnpj,
    emailNotificacao: 'educacao@oscorp.com',
    fusoHorario: 'America/Sao_Paulo',
    dominiosAutorizados: 'oscorp.com, lab.oscorp.com',
  },
  politicas: {
    exigirPresencaMinima: true,
    certificacaoAutomatica: true,
    permitirDownloadMateriais: true,
    exigir2FA: true,
  },
};
