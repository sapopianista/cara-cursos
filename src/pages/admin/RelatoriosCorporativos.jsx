import { useState } from 'react';
import { CheckCircle2, Download, FileText } from 'lucide-react';

/**
 * Dados simulados para integração futura com a API REST Java/JDBC:
 * - GET /api/admin/relatorios
 */
const METRICAS = {
  totalGerados: '1.248',
  taxaConclusao: '83%',
  horasTreinadas: '3.840h',
};

const MODELOS_RELATORIOS = [
  {
    id: 'rel-1',
    titulo: 'Engajamento e Frequência',
    descricao:
      'Mapeamento de dias com maior acesso, tempo médio por sessão e colaboradores ativos.',
    formato: 'XLSX',
  },
  {
    id: 'rel-2',
    titulo: 'Conclusão de Cursos e Trilhas',
    descricao:
      'Percentual de finalização por departamento, índices de aprovação e tempo médio para conclusão.',
    formato: 'PDF',
  },
  {
    id: 'rel-3',
    titulo: 'Investimento Corporativo (ROI)',
    descricao:
      'Análise de custo por colaborador capacitado e carga horária acumulada por centro de custo.',
    formato: 'PDF',
  },
  {
    id: 'rel-4',
    titulo: 'Avaliações e Satisfação (NPS)',
    descricao:
      'Notas médias das aulas, avaliação dos instrutores e feedbacks enviados pelos alunos.',
    formato: 'CSV',
  },
  {
    id: 'rel-5',
    titulo: 'Desempenho Individual',
    descricao:
      'Histórico de cursos concluídos, certificados emitidos e assiduidade por colaborador.',
    formato: 'PDF',
  },
  {
    id: 'rel-6',
    titulo: 'Auditoria de Conformidade e LGPD',
    descricao:
      'Verificação de treinamentos obrigatórios concluídos e lista de pendências por equipe.',
    formato: 'CSV',
  },
];

const RELATORIOS_RECENTES_INICIAIS = [
  {
    id: 101,
    nomeArquivo: 'Engajamento_Consolidado_Q2_Oscorp.xlsx',
    formato: 'XLSX',
    responsavel: 'Tiago Martins (RH)',
    dataHora: 'Hoje, 14:32',
  },
  {
    id: 102,
    nomeArquivo: 'Conformidade_Normativa_Junho.pdf',
    formato: 'PDF',
    responsavel: 'Maria Soares (Segurança)',
    dataHora: 'Ontem, 18:10',
  },
  {
    id: 103,
    nomeArquivo: 'ROI_Capacitacao_Tecnologica_2025.pdf',
    formato: 'PDF',
    responsavel: 'Ana Paula Gomes (Operações)',
    dataHora: '04/06/2025',
  },
];

export default function RelatoriosCorporativos() {
  const [recentes, setRecentes] = useState(RELATORIOS_RECENTES_INICIAIS);
  const [feedback, setFeedback] = useState('');

  const handleGerarRelatorio = (modelo) => {
    const ext = modelo.formato.toLowerCase();
    const nomeArquivo = `${modelo.titulo.replace(/\s+/g, '_')}_2025.${ext}`;
    const novoItem = {
      id: Date.now(),
      nomeArquivo,
      formato: modelo.formato,
      responsavel: 'Tiago Vieira (Admin)',
      dataHora: 'Agora mesmo',
    };

    setRecentes((atuais) => [novoItem, ...atuais]);
    setFeedback(`Relatório "${nomeArquivo}" gerado e adicionado ao histórico.`);
  };

  const handleDownload = (nomeArquivo) => {
    const blob = new Blob([`Relatório Corporativo Oscorp: ${nomeArquivo}`], {
      type: 'text/plain;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-12 py-4">
      <header className="border-b border-line pb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Inteligência de Dados • Oscorp
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Relatórios Corporativos
        </h1>
        <p className="mt-2 max-w-2xl text-base text-muted">
          Exporte indicadores de engajamento, conclusão de trilhas e conformidade regulatória.
        </p>
      </header>

      {/* Indicadores consolidados */}
      <dl className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Relatórios gerados
          </dt>
          <dd className="mt-2 text-3xl font-bold text-ink">{METRICAS.totalGerados}</dd>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Taxa média de conclusão
          </dt>
          <dd className="mt-2 text-3xl font-bold text-accent">{METRICAS.taxaConclusao}</dd>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-subtle">
            Horas treinadas no ciclo
          </dt>
          <dd className="mt-2 text-3xl font-bold text-ink">{METRICAS.horasTreinadas}</dd>
        </div>
      </dl>

      {feedback && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-ink"
        >
          <CheckCircle2 size={18} className="shrink-0 text-accent" aria-hidden />
          <span>{feedback}</span>
        </div>
      )}

      {/* Modelos de Relatórios */}
      <section aria-labelledby="modelos-relatorios-titulo" className="space-y-5">
        <div>
          <h2 id="modelos-relatorios-titulo" className="text-xl font-semibold text-ink">
            Modelos disponíveis para exportação
          </h2>
          <p className="mt-1 text-sm text-muted">
            Selecione um modelo para gerar o arquivo atualizado.
          </p>
        </div>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MODELOS_RELATORIOS.map((modelo) => (
            <li
              key={modelo.id}
              className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <FileText size={20} aria-hidden />
                  </span>
                  <span className="rounded-lg bg-surface2 px-2.5 py-1 font-mono text-xs font-semibold text-muted">
                    {modelo.formato}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-semibold text-ink">{modelo.titulo}</h3>
                <p className="mt-1.5 text-sm text-muted">{modelo.descricao}</p>
              </div>

              <button
                type="button"
                onClick={() => handleGerarRelatorio(modelo)}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-onprimary transition-colors hover:bg-primary-hover"
              >
                <Download size={16} aria-hidden />
                Gerar {modelo.formato}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Histórico recente */}
      <section aria-labelledby="historico-relatorios-titulo" className="space-y-4">
        <h2 id="historico-relatorios-titulo" className="text-xl font-semibold text-ink">
          Arquivos gerados recentemente
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface2/60 text-xs font-semibold uppercase tracking-wider text-subtle">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Arquivo
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Formato
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Gerado por
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Data
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentes.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 font-medium text-ink">{item.nomeArquivo}</td>
                  <td className="px-5 py-4 font-mono text-xs text-muted">{item.formato}</td>
                  <td className="px-5 py-4 text-muted">{item.responsavel}</td>
                  <td className="px-5 py-4 text-muted">{item.dataHora}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDownload(item.nomeArquivo)}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      <Download size={15} aria-hidden />
                      Baixar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
