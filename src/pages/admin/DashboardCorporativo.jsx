import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CircleAlert, Radio } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { getDashboardCorporativo } from '../../services/api';
import Avatar from '../../components/ui/Avatar';
import DonutChart from '../../components/ui/DonutChart';
import SegmentedControl from '../../components/ui/SegmentedControl';

export default function DashboardCorporativo() {
  const [periodo, setPeriodo] = useState('7dias');
  const { dados, carregando, erro } = useApi(() => getDashboardCorporativo(periodo), [periodo]);

  if (carregando) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-4 animate-pulse" aria-busy="true">
        <div className="h-16 w-1/3 rounded-xl bg-surface2" />
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-28 rounded-2xl bg-surface2" />
          <div className="h-28 rounded-2xl bg-surface2" />
          <div className="h-28 rounded-2xl bg-surface2" />
        </div>
        <div className="h-80 rounded-2xl bg-surface2" />
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div
        role="alert"
        className="mx-auto mt-10 flex max-w-5xl items-center gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-5 text-base text-ink"
      >
        <CircleAlert size={20} className="shrink-0 text-danger" aria-hidden />
        Não foi possível carregar o dashboard corporativo.
      </div>
    );
  }

  const { empresa, atividadeRecente, horariosMaisAcessados, visaoGeralTreinamento } = dados;

  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-10 py-4">
      <header className="flex flex-col justify-between gap-4 border-b border-line pb-8 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Visão Executiva • {empresa}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Dashboard Corporativo
          </h1>
          <p className="mt-2 max-w-xl text-base text-muted">
            Acompanhamento de frequência, engajamento e conclusão de cursos da equipe.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            opcoes={[
              { valor: '7dias', rotulo: 'Últimos 7 dias' },
              { valor: 'semana', rotulo: 'Semana passada' },
              { valor: 'mes', rotulo: 'Mês atual' },
            ]}
            valor={periodo}
            onChange={setPeriodo}
            variante="pill"
            rotulo="Período do relatório"
          />

          <Link
            to="/admin/relatorios"
            className="rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-onprimary transition-colors hover:bg-primary-hover"
          >
            Ver relatórios
          </Link>
        </div>
      </header>

      {/* Indicadores principais de treinamento */}
      <section aria-labelledby="indicadores-treinamento-titulo">
        <h2 id="indicadores-treinamento-titulo" className="sr-only">
          Indicadores gerais de treinamento
        </h2>

        <dl className="grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface p-5">
            <dt className="text-xs font-semibold uppercase tracking-wider text-subtle">
              Engajamento na plataforma
            </dt>
            <dd className="mt-2 text-3xl font-bold text-accent">
              {visaoGeralTreinamento.engajamento}%
            </dd>
            <p className="mt-1 text-xs text-muted">
              Meta corporativa atingida ({visaoGeralTreinamento.metaBatida})
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <dt className="text-xs font-semibold uppercase tracking-wider text-subtle">
              Cursos concluídos
            </dt>
            <dd className="mt-2 text-3xl font-bold text-ink">
              {visaoGeralTreinamento.cursosConcluidos}%
            </dd>
            <p className="mt-1 text-xs text-muted">Média das trilhas ativas no ciclo</p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <dt className="text-xs font-semibold uppercase tracking-wider text-subtle">
              Satisfação média
            </dt>
            <dd className="mt-2 text-3xl font-bold text-ink">
              {visaoGeralTreinamento.avaliacaoMedia}%
            </dd>
            <p className="mt-1 text-xs text-muted">Avaliações positivas nas aulas</p>
          </div>
        </dl>
      </section>

      {/* Atividade recente + Horários mais acessados */}
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section
          aria-labelledby="atividade-recente-titulo"
          className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-6"
        >
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
              <div>
                <h2 id="atividade-recente-titulo" className="text-lg font-semibold text-ink">
                  Atividade recente
                </h2>
                <p className="text-xs text-muted">
                  Colaboradores que acessaram a plataforma recentemente
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                <Radio size={13} aria-hidden />
                {atividadeRecente.ativosHoje} ativos hoje
              </span>
            </div>

            <ul className="mt-4 divide-y divide-line">
              {atividadeRecente.colaboradores.map((colab) => (
                <li key={colab.id} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar nome={colab.nome} tamanho="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{colab.nome}</p>
                      <p className="truncate text-xs text-muted">{colab.email}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 text-xs">
                    <span className="hidden rounded-lg bg-surface2 px-2.5 py-1 font-medium text-muted sm:inline-block">
                      {colab.cargo}
                    </span>
                    <span className="text-muted">{colab.ultimoAcesso}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
            <span>
              Mostrando {atividadeRecente.colaboradores.length} de{' '}
              {atividadeRecente.totalCadastrados} colaboradores
            </span>
            <Link
              to="/admin/funcionarios"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              Ver todos
              <ChevronRight size={14} aria-hidden />
            </Link>
          </div>
        </section>

        <section
          aria-labelledby="horarios-acessados-titulo"
          className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-6"
        >
          <div className="border-b border-line pb-4">
            <h2 id="horarios-acessados-titulo" className="text-lg font-semibold text-ink">
              Horários mais acessados
            </h2>
            <p className="text-xs text-muted">{horariosMaisAcessados.periodo}</p>
          </div>

          <div className="my-6 flex flex-col items-center justify-center">
            <DonutChart
              segmentos={horariosMaisAcessados.segmentos.map((s) => ({
                valor: s.percentual,
                cor: s.cor,
              }))}
              tamanho={180}
              espessura={18}
              rotulo="Distribuição de sessões por turno"
            >
              <span className="text-2xl font-bold text-ink">
                {horariosMaisAcessados.totalSessoes}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Sessões
              </span>
            </DonutChart>

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs">
              {horariosMaisAcessados.segmentos
                .filter((s) => s.turno !== 'Madrugada')
                .map((seg) => (
                  <li key={seg.turno} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: seg.cor }}
                    />
                    <span className="text-muted">{seg.turno}</span>
                    <span className="font-semibold text-ink">{seg.percentual}%</span>
                  </li>
                ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
