/**
 * MOCK DATA — Dashboard do Aluno.
 *
 * Este objeto é exatamente o JSON que o endpoint Java deve devolver:
 *   GET /api/alunos/me/dashboard
 * Nomes simples (camelCase, sem nada de UI) para mapear 1:1 com DTOs do JDBC.
 *
 * Mantido propositalmente enxuto: apenas o que a tela exibe.
 */
export const dashboardAluno = {
  usuario: {
    id: 4092,
    nome: 'Tiago',
  },

  metaSemanal: {
    horasEstudadas: 5.4,
    horasMeta: 8,
  },

  continuarAssistindo: {
    cursoId: 12,
    modulo: 'Módulo 02',
    categoria: 'Comunicação Empresarial',
    titulo: 'O que é a Comunicação Assertiva',
    percentualAssistido: 42,
    tempoRestante: '13 min',
    tema: 'azul',
    imagem: null, // URL da capa vinda da API (ex.: "/media/capas/12.jpg")
  },

  cursosEmAndamento: [
    { id: 12, titulo: 'Comunicação Assertiva no Ambiente de Trabalho', progresso: 65 },
    { id: 15, titulo: 'Gestão de Tempo e Prioridades', progresso: 30 },
    { id: 21, titulo: 'Excel para Produtividade e Análise de Dados', progresso: 12 },
  ],

  atividades: [
    {
      id: 1,
      curso: 'Gestão do Tempo',
      titulo: 'Aplicar técnicas da Matriz de Eisenhower',
      diasRestantes: 2,
      entrega: '28/Out',
      acao: 'enviar', // enviar | nenhuma
    },
    {
      id: 2,
      curso: 'Comunicação Assertiva',
      titulo: 'Simulação de feedback construtivo',
      diasRestantes: 3,
      entrega: '29/Out',
      acao: 'nenhuma',
    },
  ],
};
