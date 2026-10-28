/**
 * MOCK DATA — Dashboard Corporativo (Visão Executiva Oscorp)
 *
 * Contrato JSON para a rota Java:
 *   GET /api/admin/dashboard
 */
export const dashboardCorporativoData = {
  empresa: 'Oscorp Enterprise',
  periodoAtivo: '7dias',
  atividadeRecente: {
    ativosHoje: 5,
    totalCadastrados: 142,
    colaboradores: [
      { id: '#4092', nome: 'Tiago', email: 'tiago@gmail.com', ultimoAcesso: 'Junho 5, 2025', cargo: 'Analista' },
      { id: '#4118', nome: 'Matheus', email: 'matheus@gmail.com', ultimoAcesso: 'Março 28, 2025', cargo: 'Estagiário' },
      { id: '#3982', nome: 'Ana', email: 'ana@gmail.com', ultimoAcesso: 'Dezembro 13, 2024', cargo: 'Assistente' },
      { id: '#3841', nome: 'Maria', email: 'maria@gmail.com', ultimoAcesso: 'Novembro 29, 2024', cargo: 'Auxiliar' },
      { id: '#3765', nome: 'Marcos', email: 'marcos@gmail.com', ultimoAcesso: 'Julho 29, 2024', cargo: 'Técnico' },
    ],
  },
  horariosMaisAcessados: {
    periodo: 'Período 1–6 Abril, 2025',
    totalSessoes: 59,
    destaque: { turno: 'Tarde', intervalo: '13h - 18h', acessos: 26 },
    segmentos: [
      { turno: 'Tarde', percentual: 44, cor: 'rgb(var(--c-primary))' },
      { turno: 'Manhã', percentual: 28, cor: 'rgb(var(--c-accent))' },
      { turno: 'Noite', percentual: 8, cor: 'rgb(var(--c-warn))' },
      { turno: 'Madrugada', percentual: 20, cor: 'rgb(var(--c-track))' },
    ],
  },
  acessos: {
    total: 301,
    variacao: '+2.1%',
    periodo: 'Acessos 1–7 Junho, 2025',
    dias: [
      { dia: '01', atual: 42, anterior: 30 },
      { dia: '02', atual: 58, anterior: 45 },
      { dia: '03', atual: 70, anterior: 55 },
      { dia: '04', atual: 48, anterior: 60 },
      { dia: '05', atual: 85, anterior: 72 },
      { dia: '06', atual: 92, anterior: 80 },
      { dia: '07', atual: 65, anterior: 50 },
    ],
  },
  visaoGeralTreinamento: {
    avaliacaoMedia: 76,
    cursosConcluidos: 83,
    engajamento: 85,
    metaBatida: '+12%',
  },
  avaliacoes: {
    total: 256,
    variacao: '-2.1%',
    periodo: 'Avaliações de 1–5 Jun, 2025',
    pontos: [
      { dia: '01', atual: 28, anterior: 45 },
      { dia: '02', atual: 65, anterior: 20 },
      { dia: '03', atual: 45, anterior: 55 },
      { dia: '04', atual: 80, anterior: 50 },
      { dia: '05', atual: 55, anterior: 70 },
    ],
  },
};
