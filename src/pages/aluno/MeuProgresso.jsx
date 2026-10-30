import { useId, useState } from 'react';
import { Award, CheckCircle2, ChevronDown, Lock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import { baixarCertificado, getProgresso } from '../../services/api';
import { cn } from '../../lib/cn';
import { data, duracao } from '../../lib/formatadores';
import Pagina, { Secao } from '../../components/ui/Pagina';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import BotaoDownload from '../../components/ui/BotaoDownload';
import { StatCard, StatGrid } from '../../components/ui/StatCard';
import { ErroCarregamento, SkeletonPagina, Vazio } from '../../components/ui/Estados';

const ESTADO = {
  concluido: {
    icone: CheckCircle2,
    caixa: 'bg-accent/15 text-accent',
    badge: 'sucesso',
    rotulo: 'Concluído',
  },
  em_andamento: {
    icone: TrendingUp,
    caixa: 'bg-primary text-onprimary',
    badge: 'info',
    rotulo: 'Em andamento',
  },
  bloqueado: { icone: Lock, caixa: 'bg-surface2 text-subtle', badge: 'neutro', rotulo: 'Bloqueado' },
};

/** Nível em formato enxuto; competências e cursos ficam atrás de "Ver detalhes". */
function NivelCard({ nivel }) {
  const [aberto, setAberto] = useState(false);
  const idDetalhes = useId();
  const e = ESTADO[nivel.estado];
  const Icone = e.icone;
  const emAndamento = nivel.estado === 'em_andamento';

  return (
    <Card as="li" espacamento="nenhum" className={cn('overflow-hidden', emAndamento && 'border-primary/60')}>
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
        <span aria-hidden className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', e.caixa)}>
          <Icone size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted">
              Nível {nivel.ordem} · {nivel.perfil}
            </span>
            <Badge tom={e.badge}>{e.rotulo}</Badge>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-ink">{nivel.titulo}</h3>
          {emAndamento ? (
            <div className="mt-3 flex max-w-md items-center gap-3">
              <ProgressBar
                valor={nivel.progresso}
                altura="h-2"
                rotulo={`Progresso do nível ${nivel.ordem}`}
              />
              <span className="shrink-0 text-sm font-semibold tabular-nums">{nivel.progresso}%</span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted">
              {nivel.estado === 'concluido'
                ? `${nivel.cursosTotais} cursos concluídos`
                : `Libera ao concluir o nível ${nivel.ordem - 1}`}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {emAndamento && nivel.proximoCurso && (
            <Button to={`/cursos/${nivel.proximoCurso.id}`}>Continuar</Button>
          )}
          <button
            type="button"
            aria-expanded={aberto}
            aria-controls={idDetalhes}
            onClick={() => setAberto((v) => !v)}
            className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
          >
            {aberto ? 'Ocultar detalhes' : 'Ver detalhes'}
            <ChevronDown
              size={15}
              aria-hidden
              className={cn('transition-transform duration-300', aberto && 'rotate-180')}
            />
          </button>
        </div>
      </div>

      <div id={idDetalhes} className="recolhivel" data-aberto={aberto} inert={aberto ? undefined : true}>
        <div>
          <div className="grid gap-5 border-t border-line bg-surface2/40 p-5 text-sm sm:grid-cols-2 sm:p-6">
            <div>
              <p className="font-semibold text-ink">Competências</p>
              <p className="mt-1 text-muted">{nivel.competencias.join(' · ')}</p>
              {emAndamento && (
                <p className="mt-3 text-muted">
                  {nivel.cursosConcluidos} de {nivel.cursosTotais} cursos · faltam cerca de{' '}
                  {duracao(nivel.minutosRestantes)}
                </p>
              )}
            </div>
            <div>
              <p className="font-semibold text-ink">Cursos do nível</p>
              <ul className="mt-1 space-y-1">
                {nivel.cursos.map((c) => (
                  <li key={c.id}>
                    <Link to={`/cursos/${c.id}`} className="text-primary hover:underline">
                      {c.titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function MeuProgresso() {
  const { dados, carregando, erro, recarregar } = useApi(getProgresso);

  return (
    <Pagina
      titulo="Meu progresso"
      descricao="Sua evolução pelos níveis de desenvolvimento e os certificados conquistados."
    >
      {carregando ? (
        <SkeletonPagina variante="lista" cabecalho={false} />
      ) : erro ? (
        <ErroCarregamento erro={erro} onTentarNovamente={recarregar} />
      ) : (
        <>
          <StatGrid>
            <StatCard rotulo="Progresso geral" valor={`${dados.resumo.percentualGeral}%`} />
            <StatCard
              rotulo="Cursos concluídos"
              valor={dados.resumo.cursosConcluidos}
              detalhe={`de ${dados.resumo.cursosTotais} no seu plano`}
            />
            <StatCard
              rotulo="Nível atual"
              valor={dados.resumo.nivelAtual ? `Nível ${dados.resumo.nivelAtual.ordem}` : 'Completo'}
              detalhe={dados.resumo.nivelAtual?.titulo}
            />
          </StatGrid>

          <Secao titulo="Níveis de desenvolvimento">
            <ol className="space-y-4">
              {dados.niveis.map((n) => (
                <NivelCard key={n.id} nivel={n} />
              ))}
            </ol>
          </Secao>

          <Secao titulo="Certificados" descricao="Documentos oficiais em PDF, com código de verificação.">
            {dados.certificados.length === 0 ? (
              <Vazio
                icone={Award}
                titulo="Nenhum certificado ainda"
                descricao="Conclua um curso ou nível para receber o primeiro."
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dados.certificados.map((cert) => (
                  <Card as="li" key={cert.id} className="flex flex-col">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-accent">
                        <Award size={16} aria-hidden />
                        {cert.origem}
                      </span>
                      <span className="font-mono text-xs text-subtle">{cert.codigo}</span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-ink">{cert.titulo}</h3>
                    <p className="mt-1 text-sm text-muted">Emitido em {data(cert.emitidoEm)}</p>
                    <div className="mt-auto pt-5">
                      <BotaoDownload
                        disponivel={Boolean(cert.url)}
                        onBaixar={() => baixarCertificado(cert)}
                        rotulo="Baixar PDF"
                        aria-label={`Baixar certificado ${cert.titulo} em PDF`}
                      />
                    </div>
                  </Card>
                ))}
              </ul>
            )}
          </Secao>
        </>
      )}
    </Pagina>
  );
}
