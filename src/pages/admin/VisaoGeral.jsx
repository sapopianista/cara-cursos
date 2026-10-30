import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { getDashboardCorporativo } from '../../services/api';
import { data, numero, relativo } from '../../lib/formatadores';
import { PERIODOS_DASHBOARD } from '../../lib/rotulos';
import Pagina from '../../components/ui/Pagina';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import DonutChart from '../../components/ui/DonutChart';
import SegmentedControl from '../../components/ui/SegmentedControl';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { ErroCarregamento, SkeletonPagina } from '../../components/ui/Estados';

const CORES_TURNO = [
  'rgb(var(--c-primary))',
  'rgb(var(--c-accent))',
  'rgb(var(--c-warn))',
  'rgb(var(--c-lilac))',
];

export default function VisaoGeral() {
  const [periodo, setPeriodo] = useState('7dias');
  const [turnoAtivo, setTurnoAtivo] = useState(null);
  const { dados, carregando, atualizando, erro, recarregar } = useApi(
    () => getDashboardCorporativo(periodo),
    [periodo],
  );

  const seletor = (
    <SegmentedControl
      opcoes={PERIODOS_DASHBOARD}
      valor={periodo}
      onChange={setPeriodo}
      rotulo="Período analisado"
    />
  );

  if (carregando) return <SkeletonPagina variante="tabela" />;
  if (erro && !dados)
    return <ErroCarregamento erro={erro} onTentarNovamente={recarregar} className="mt-10" />;

  const { indicadores, atividadeRecente, sessoesPorTurno } = dados;
  const metaBatida = indicadores.engajamento >= indicadores.metaEngajamento;
  const segmentos = sessoesPorTurno.segmentos.map((s, i) => ({
    ...s,
    cor: CORES_TURNO[i % CORES_TURNO.length],
  }));
  const destaque = turnoAtivo != null ? segmentos[turnoAtivo] : null;

  return (
    <Pagina
      titulo="Visão geral"
      descricao={`Engajamento e conclusão de cursos de ${data(dados.periodo.inicio)} a ${data(dados.periodo.fim)}.`}
      acoes={seletor}
    >
      <StatGrid atualizando={atualizando}>
        <StatCard
          rotulo="Engajamento"
          valor={`${indicadores.engajamento}%`}
          destaque={metaBatida}
          detalhe={
            metaBatida
              ? `Acima da meta de ${indicadores.metaEngajamento}%`
              : `Abaixo da meta de ${indicadores.metaEngajamento}%`
          }
          tomDetalhe={metaBatida ? 'sucesso' : 'alerta'}
        />
        <StatCard
          rotulo="Conclusão média"
          valor={`${indicadores.conclusaoMedia}%`}
          detalhe="Progresso médio dos colaboradores ativos"
        />
        <StatCard
          rotulo="Satisfação"
          valor={indicadores.satisfacao.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
          detalhe="Nota média das aulas (de 0 a 5)"
        />
      </StatGrid>

      <div
        className="grid gap-6 transition-opacity duration-200 lg:grid-cols-[1.4fr_1fr]"
        style={{ opacity: atualizando ? 0.6 : 1 }}
        aria-busy={atualizando || undefined}
      >
        <Card as="section" aria-labelledby="atividade-recente" espacamento="lg" className="flex flex-col">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 id="atividade-recente" className="text-lg font-semibold text-ink">
                Acessos recentes
              </h2>
              <p className="text-sm text-muted">Quem entrou na plataforma por último</p>
            </div>
            <Badge tom="sucesso">{atividadeRecente.ativosHoje} ativos hoje</Badge>
          </div>

          <ul className="mt-4 divide-y divide-line">
            {atividadeRecente.colaboradores.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar nome={c.nome} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{c.nome}</p>
                    <p className="truncate text-sm text-muted">{c.cargo}</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm text-muted">{relativo(c.ultimoAcesso)}</span>
              </li>
            ))}
          </ul>

          <Link
            to="/admin/colaboradores"
            className="mt-auto inline-flex items-center gap-1 self-start pt-4 text-sm font-semibold text-primary hover:underline"
          >
            Ver os {numero(atividadeRecente.totalColaboradores)} colaboradores ativos
            <ArrowRight size={15} aria-hidden />
          </Link>
        </Card>

        <Card as="section" aria-labelledby="sessoes-turno" espacamento="lg">
          <h2 id="sessoes-turno" className="text-lg font-semibold text-ink">
            Horários de acesso
          </h2>
          <p className="text-sm text-muted">Distribuição das sessões por turno</p>

          <div className="mt-6 flex flex-col items-center">
            <DonutChart
              segmentos={segmentos.map((s) => ({ valor: s.percentual, cor: s.cor }))}
              tamanho={180}
              espessura={18}
              rotulo={`Sessões por turno: ${segmentos.map((s) => `${s.turno} ${s.percentual}%`).join(', ')}`}
              ativo={turnoAtivo}
              onAtivoChange={setTurnoAtivo}
            >
              <span className="text-2xl font-bold tabular-nums text-ink">
                {destaque ? `${destaque.percentual}%` : numero(sessoesPorTurno.total)}
              </span>
              <span className="text-xs font-medium text-muted">{destaque ? destaque.turno : 'sessões'}</span>
            </DonutChart>

            {/* Legenda completa: todo segmento do gráfico aparece aqui. */}
            <ul className="mt-6 grid w-full gap-1 text-sm">
              {segmentos.map((s, i) => (
                <li key={s.turno}>
                  <button
                    type="button"
                    onMouseEnter={() => setTurnoAtivo(i)}
                    onMouseLeave={() => setTurnoAtivo(null)}
                    onFocus={() => setTurnoAtivo(i)}
                    onBlur={() => setTurnoAtivo(null)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface2"
                  >
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: s.cor }}
                    />
                    <span className="text-muted">
                      {s.turno} <span className="text-xs">({s.intervalo})</span>
                    </span>
                    <span className="ml-auto font-semibold tabular-nums text-ink">{s.percentual}%</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </Pagina>
  );
}
