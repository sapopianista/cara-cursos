/**
 * MOCK DATA — Tela "Descobrir" (Home / Portal de Aprendizado)
 *
 * Contrato JSON para a rota Java:
 *   GET /api/alunos/me/descobrir
 */
export const descobrirData = {
  usuario: {
    nome: 'Tiago',
    diasSeguidos: 12,
    certificados: 4,
  },
  destaques: {
    trilha: {
      tag: 'RECOMENDADO',
      titulo: 'Trilhas de Carreira',
      subtitulo: 'Siga um plano de crescimento profissional',
      descricao:
        'Trilhas prontas para você evoluir no seu cargo atual ou se preparar para novos desafios de liderança e impacto corporativo.',
      link: '/trilhas',
      totalDisponiveis: '8 trilhas disponíveis',
      tema: 'teal',
    },
    avulso: {
      tag: 'Catálogo Avulso',
      titulo: 'Cursos Individuais',
      subtitulo: 'Aprenda no seu ritmo',
      descricao:
        'Escolha cursos avulsos por tema, habilidade ou área de atuação e comece a praticar imediatamente.',
      link: '/cursos',
      tema: 'ambar',
    },
  },
  cursosEmAndamento: [
    {
      id: 1,
      categoria: 'SOFT SKILLS',
      categoriaSlug: 'soft-skills',
      titulo: 'Comunicação Eficaz no Ambiente de Trabalho',
      descricao: 'Aprenda a se comunicar com clareza, empatia e assertividade com equipes e liderança.',
      duracao: '2 horas',
      nota: 4.9,
      totalAvaliacoes: 320,
      progresso: 65,
      status: 'em_andamento',
      instrutor: {
        nome: 'Prof. Carla Lima',
        iniciais: 'CL',
        foto: null,
      },
      tema: 'azul',
    },
    {
      id: 2,
      categoria: 'ORGANIZAÇÃO & EFICIÊNCIA',
      categoriaSlug: 'organizacao',
      titulo: 'Gestão do Tempo e Produtividade Pessoal',
      descricao: 'Técnicas práticas para gerenciar prioridades, lidar com distrações e rotinas de alta entrega.',
      duracao: '1h30min',
      nota: 4.8,
      totalAvaliacoes: 412,
      progresso: 30,
      status: 'em_andamento',
      instrutor: {
        nome: 'Prof. Marcos Silva',
        iniciais: 'MS',
        foto: null,
      },
      tema: 'ambar',
    },
    {
      id: 3,
      categoria: 'PENSAMENTO CRÍTICO',
      categoriaSlug: 'pensamento-critico',
      titulo: 'Resolução de Problemas e Tomada de Decisão',
      descricao: 'Aprenda a analisar cenários complexos, estruturar hipóteses e tomar decisões fundamentadas.',
      duracao: '2 horas',
      nota: 4.9,
      totalAvaliacoes: 189,
      progresso: 0,
      status: 'nao_iniciado',
      instrutor: {
        nome: 'Dra. Renata Neves',
        iniciais: 'RN',
        foto: null,
      },
      tema: 'roxo',
    },
    {
      id: 4,
      categoria: 'FERRAMENTAS DE TRABALHO',
      categoriaSlug: 'ferramentas',
      titulo: 'Excel para o Dia a Dia no Escritório',
      descricao: 'Domine o essencial de planilhas para organizar dados, estruturar relatórios e automatizar tarefas.',
      duracao: '3 horas',
      nota: 4.8,
      totalAvaliacoes: 540,
      progresso: 85,
      status: 'em_andamento',
      instrutor: {
        nome: 'Prof. Felipe Alves',
        iniciais: 'FA',
        foto: null,
      },
      tema: 'ciano',
    },
  ],
  metaSemanalBanner: {
    titulo: 'Meta semanal quase alcançada!',
    descricao: 'Faltam apenas 45 minutos de estudo para garantir sua insígnia de consistência semanal.',
    linkMetas: '/area-do-aluno',
    linkRetomar: '/cursos/1',
  },
};
