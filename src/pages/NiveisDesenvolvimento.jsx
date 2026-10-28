import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Download,
  Lock,
  TrendingUp,
} from 'lucide-react';

/**
 * Dados simulados para integração futura com a API REST Java/JDBC:
 * - GET /api/aluno/niveis
 * - GET /api/aluno/certificados
 */
const RESUMO_PROGRESSO = {
  nivelAtual: 'Nível 2 em andamento',
  modulosConcluidos: 20,
  modulosTotais: 52,
  percentualGlobal: 41,
};

const NIVEIS = [
  {
    id: 'nivel-1',
    numero: 'Nível 1',
    titulo: 'Fundamentos e Onboarding',
    perfil: 'Iniciante',
    estado: 'concluido',
    statusTexto: 'Concluído (100%)',
    resumo: '12 cursos concluídos • 45 horas estudadas • Certificado emitido',
    competencias: [
      'Cultura da Empresa',
      'Ferramentas de Trabalho',
      'Comunicação Básica',
      'Rotinas Corporativas',
    ],
  },
  {
    id: 'nivel-2',
    numero: 'Nível 2',
    titulo: 'Execução e Produtividade',
    perfil: 'Intermediário',
    estado: 'andamento',
    statusTexto: 'Em andamento (65%)',
    resumo: '8 de 14 cursos concluídos • 32 horas restantes',
    progresso: 65,
    proximaAula: 'Dashboards em BI Avançado',
    competencias: [
      'Resolução de Problemas',
      'Excel e Dados',
      'Gestão de Tempo',
      'Metodologia Ágil',
    ],
  },
  {
    id: 'nivel-3',
    numero: 'Nível 3',
    titulo: 'Especialização e Autonomia',
    perfil: 'Avançado',
    estado: 'bloqueado',
    statusTexto: 'Bloqueado',
    resumo: '16 cursos • 80 horas de formação • Desbloqueia após concluir o Nível 2',
    competencias: [
      'Arquitetura de Projetos',
      'Comunicação Assertiva',
      'Mentoria de Pares',
      'Otimização de Processos',
    ],
  },
  {
    id: 'nivel-4',
    numero: 'Nível 4',
    titulo: 'Liderança e Gestão Estratégica',
    perfil: 'Executivo / Sênior',
    estado: 'bloqueado',
    statusTexto: 'Bloqueado',
    resumo: '10 cursos executivos • 60 horas • Requer conclusão do Nível 3',
    competencias: [
      'Tomada de Decisão',
      'Gestão Orçamentária',
      'Liderança Multidisciplinar',
      'Visão de Negócio',
    ],
  },
];

const CERTIFICADOS = [
  {
    id: 'cert-1',
    nivel: 'Nível 1',
    titulo: 'Fundamentos e Onboarding',
    dataEmissao: '14/05/2024',
    codigo: 'CC-9482-OSC',
  },
  {
    id: 'cert-2',
    nivel: 'Módulo Nível 2',
    titulo: 'Excel Corporativo e Análise de Dados',
    dataEmissao: '02/07/2024',
    codigo: 'CC-7393-EXC',
  },
  {
    id: 'cert-3',
    nivel: 'Módulo Nível 2',
    titulo: 'Gestão de Tempo e Métodos Ágeis',
    dataEmissao: '19/08/2024',
    codigo: 'CC-8821-AGE',
  },
];

export default function NiveisDesenvolvimento() {
  const [certificadoBaixado, setCertificadoBaixado] = useState(null);

  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-12 py-4">
      {/* Cabeçalho direto com resumo de progresso */}
      <header className="flex flex-col justify-between gap-6 border-b border-line pb-8 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Progressão de Carreira
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Níveis de Desenvolvimento
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted">
            Acompanhe sua evolução desde os fundamentos operacionais até a liderança executiva.
          </p>
        </div>

        <div className="shrink-0 rounded-2xl border border-line bg-surface px-5 py-4">
          <p className="text-xs font-medium text-subtle">Maturidade global</p>
          <p className="mt-1 text-lg font-bold text-ink">
            {RESUMO_PROGRESSO.percentualGlobal}% •{' '}
            <span className="text-accent">{RESUMO_PROGRESSO.nivelAtual}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {RESUMO_PROGRESSO.modulosConcluidos} de {RESUMO_PROGRESSO.modulosTotais} módulos concluídos
          </p>
        </div>
      </header>

      {/* Lista ordenada dos 4 níveis */}
      <section aria-labelledby="trilha-niveis-titulo">
        <h2 id="trilha-niveis-titulo" className="sr-only">
          Etapas da trilha de desenvolvimento
        </h2>

        <ol className="space-y-5">
          {NIVEIS.map((nivel) => {
            const emAndamento = nivel.estado === 'andamento';
            const concluido = nivel.estado === 'concluido';
            const bloqueado = nivel.estado === 'bloqueado';

            return (
              <li
                key={nivel.id}
                className={`rounded-2xl border p-6 transition-colors ${
                  emAndamento
                    ? 'border-primary bg-surface shadow-sm'
                    : concluido
                      ? 'border-line bg-surface'
                      : 'border-line bg-surface/60'
                }`}
              >
                <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                  <div className="flex items-start gap-4">
                    <div
                      aria-hidden
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        concluido
                          ? 'bg-accent/15 text-accent'
                          : emAndamento
                            ? 'bg-primary text-onprimary'
                            : 'bg-surface2 text-subtle'
                      }`}
                    >
                      {concluido && <CheckCircle2 size={22} />}
                      {emAndamento && <TrendingUp size={22} />}
                      {bloqueado && <Lock size={20} />}
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-subtle">
                          {nivel.numero} • {nivel.perfil}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            concluido
                              ? 'bg-accent/15 text-accent'
                              : emAndamento
                                ? 'bg-primary/15 text-primary'
                                : 'bg-surface2 text-muted'
                          }`}
                        >
                          {nivel.statusTexto}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-ink">{nivel.titulo}</h3>
                        <p className="mt-1 text-sm text-muted">{nivel.resumo}</p>
                      </div>

                      {emAndamento && (
                        <div className="max-w-md pt-1">
                          <div className="mb-1.5 flex justify-between text-xs">
                            <span className="text-muted">Progresso do nível</span>
                            <span className="font-semibold text-ink">{nivel.progresso}%</span>
                          </div>
                          <div
                            role="progressbar"
                            aria-label={`Progresso do ${nivel.numero}`}
                            aria-valuenow={nivel.progresso}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            className="h-2 w-full overflow-hidden rounded-full bg-surface2"
                          >
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${nivel.progresso}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <ul
                        aria-label={`Competências do ${nivel.numero}`}
                        className="flex flex-wrap gap-2 pt-1"
                      >
                        {nivel.competencias.map((competencia) => (
                          <li
                            key={competencia}
                            className="rounded-lg border border-line bg-surface2 px-2.5 py-1 text-xs font-medium text-muted"
                          >
                            {competencia}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Ação principal somente onde faz sentido */}
                  <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
                    {emAndamento && (
                      <>
                        <p className="text-xs text-muted">
                          Próxima aula: <strong className="text-ink">{nivel.proximaAula}</strong>
                        </p>
                        <Link
                          to="/trilhas"
                          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-onprimary transition-colors hover:bg-primary-hover"
                        >
                          Continuar trilha
                          <ArrowRight size={16} aria-hidden />
                        </Link>
                      </>
                    )}

                    {concluido && (
                      <Link
                        to="/cursos"
                        className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface2 px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface"
                      >
                        Revisar cursos
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Certificados conquistados */}
      <section aria-labelledby="certificados-titulo" className="space-y-5">
        <div>
          <h2 id="certificados-titulo" className="text-xl font-semibold text-ink">
            Certificados conquistados
          </h2>
          <p className="mt-1 text-sm text-muted">
            Documentos oficiais disponíveis para download em PDF.
          </p>
        </div>

        {certificadoBaixado && (
          <p
            role="status"
            className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-medium text-ink"
          >
            Download iniciado: <strong>{certificadoBaixado}</strong>.
          </p>
        )}

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CERTIFICADOS.map((cert) => (
            <li
              key={cert.id}
              className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                    <Award size={16} aria-hidden />
                    {cert.nivel}
                  </span>
                  <span className="font-mono text-xs text-subtle">{cert.codigo}</span>
                </div>

                <h3 className="mt-3 text-base font-semibold text-ink">{cert.titulo}</h3>
                <p className="mt-1 text-xs text-muted">Emitido em {cert.dataEmissao}</p>
              </div>

              <button
                type="button"
                onClick={() => setCertificadoBaixado(`${cert.titulo} (${cert.codigo}.pdf)`)}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface2 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-primary hover:text-primary"
              >
                <Download size={16} aria-hidden />
                Baixar certificado (PDF)
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
