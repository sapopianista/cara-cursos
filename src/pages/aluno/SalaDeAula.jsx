import { Link, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, ClipboardCheck, FileText, PlayCircle, SkipForward } from 'lucide-react';
import useApi from '../../hooks/useApi';
import useMutacao from '../../hooks/useMutacao';
import { useTituloPagina } from '../../hooks/utilitarios';
import { baixarMaterial, concluirAula, getSalaDeAula, salvarProgressoAula } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/cn';
import { tamanhoArquivo, tempoVideo } from '../../lib/formatadores';
import Pagina, { Secao } from '../../components/ui/Pagina';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import BotaoDownload from '../../components/ui/BotaoDownload';
import { Carregando, ErroCarregamento, Skeleton } from '../../components/ui/Estados';
import PlayerAula from '../../components/sala/PlayerAula';
import AtividadeCard from '../../components/atividades/AtividadeCard';

function SalaSkeleton() {
  return (
    <Carregando rotulo="Carregando a aula…" className="mx-auto max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Skeleton className="aspect-video rounded-2xl" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </Carregando>
  );
}

function ListaAulas({ cursoId, aulas, aulaAtivaId, progresso }) {
  const concluidas = aulas.filter((a) => a.status === 'concluida').length;
  return (
    <Card
      as="nav"
      aria-labelledby="conteudo-curso"
      espacamento="nenhum"
      className="overflow-hidden lg:sticky lg:top-20"
    >
      <div className="border-b border-line p-5">
        <h2 id="conteudo-curso" className="text-base font-semibold text-ink">
          Conteúdo do curso
        </h2>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar valor={progresso} rotulo="Progresso no curso" cor="accent" />
          <span className="shrink-0 text-sm tabular-nums text-muted">
            {concluidas}/{aulas.length}
          </span>
        </div>
      </div>
      <ol className="max-h-[60vh] space-y-1 overflow-y-auto p-2">
        {aulas.map((aula) => {
          const ativa = aula.id === aulaAtivaId;
          const concluida = aula.status === 'concluida';
          const Icone = concluida ? CheckCircle2 : aula.tipo === 'avaliacao' ? ClipboardCheck : PlayCircle;
          return (
            <li key={aula.id}>
              <Link
                to={`/cursos/${cursoId}/aulas/${aula.id}`}
                replace
                aria-current={ativa ? 'step' : undefined}
                className={cn(
                  'flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                  ativa ? 'bg-primary/15 text-primary' : 'text-ink hover:bg-surface2',
                )}
              >
                <Icone
                  size={17}
                  aria-hidden
                  className={cn(
                    'mt-0.5 shrink-0',
                    concluida ? 'text-accent' : ativa ? 'text-primary' : 'text-subtle',
                  )}
                />
                <span className="min-w-0 flex-1">
                  <span className={cn('block leading-snug', ativa && 'font-semibold')}>
                    {aula.ordem}. {aula.titulo}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {aula.tipo === 'avaliacao' ? 'Avaliação · ' : ''}
                    {tempoVideo(aula.duracaoSegundos)}
                    {concluida && <span className="sr-only"> · concluída</span>}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/**
 * Sala de aula: /cursos/:cursoId e /cursos/:cursoId/aulas/:aulaId.
 * A aula escolhida fica na URL (dá para compartilhar e usar o "voltar").
 */
export default function SalaDeAula() {
  const { cursoId, aulaId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { dados, carregando, erro, recarregar, setDados } = useApi(() => getSalaDeAula(cursoId), [cursoId]);
  const conclusao = useMutacao(concluirAula, { onErro: (e) => toast.erro(e.message) });

  const curso = dados?.curso;
  const aulas = dados?.aulas ?? [];
  const aula =
    aulas.find((a) => a.id === Number(aulaId)) ?? aulas.find((a) => a.id === dados?.aulaAtualId) ?? aulas[0];
  const indice = aulas.indexOf(aula);
  const proxima = indice >= 0 ? aulas[indice + 1] : undefined;

  useTituloPagina(aula ? `${aula.titulo} · ${curso.titulo}` : 'Sala de aula');

  // Trocou de curso: não mostra a aula do curso anterior enquanto carrega.
  if (carregando || (curso && curso.id !== Number(cursoId))) return <SalaSkeleton />;
  if (erro) {
    return (
      <Pagina
        titulo="Sala de aula"
        cabecalhoOculto
        voltar={{ to: '/explorar', rotulo: 'Voltar para Explorar' }}
      >
        <ErroCarregamento erro={erro} onTentarNovamente={erro.status === 404 ? undefined : recarregar} />
      </Pagina>
    );
  }

  const irPara = (a) => navigate(`/cursos/${curso.id}/aulas/${a.id}`, { replace: true });

  const marcarConcluida = async ({ silencioso = false } = {}) => {
    if (aula.status === 'concluida') return;
    const r = await conclusao.executar(curso.id, aula.id);
    if (!r) return;
    setDados((d) => ({
      ...d,
      curso: { ...d.curso, progresso: r.progressoCurso },
      aulas: d.aulas.map((a) => (a.id === aula.id ? { ...a, status: 'concluida' } : a)),
    }));
    if (r.progressoCurso >= 100) toast.sucesso('Parabéns! Você concluiu o curso.');
    else if (!silencioso) toast.sucesso('Aula marcada como concluída.');
  };

  const salvarPosicao = (segundos) => {
    salvarProgressoAula(curso.id, aula.id, segundos).catch(() => {
      /* falha silenciosa: a próxima tentativa salva de novo */
    });
  };

  const voltar = curso.trilha
    ? { to: `/trilhas/${curso.trilha.id}`, rotulo: `Trilha ${curso.trilha.titulo}` }
    : { to: '/explorar', rotulo: 'Voltar para Explorar' };

  return (
    <Pagina titulo={aula.titulo} tituloAba={false} cabecalhoOculto voltar={voltar} largura="larga">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-8">
          <PlayerAula
            key={aula.id}
            aula={aula}
            onSalvarPosicao={salvarPosicao}
            onTerminar={() => marcarConcluida({ silencioso: true })}
            proximaAula={proxima}
            onProxima={() => proxima && irPara(proxima)}
          />

          <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-muted">
                Aula {aula.ordem} de {aulas.length} ·{' '}
                <span className="font-medium text-ink">{curso.titulo}</span>
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">{aula.titulo}</h1>
              <p className="mt-1 text-sm text-muted">
                Com {curso.instrutor.nome}, {curso.instrutor.cargo}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {aula.status === 'concluida' ? (
                <span className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-accent">
                  <CheckCircle2 size={16} aria-hidden />
                  Concluída
                </span>
              ) : (
                <Button
                  variante="secondary"
                  onClick={() => marcarConcluida()}
                  carregando={conclusao.executando}
                >
                  Marcar como concluída
                </Button>
              )}
              {proxima && (
                <Button iconeDireita={SkipForward} onClick={() => irPara(proxima)}>
                  Próxima aula
                </Button>
              )}
            </div>
          </header>

          {dados.materiais.length > 0 && (
            <Secao titulo="Material de apoio">
              <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
                {dados.materiais.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <FileText size={18} className="shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-ink">{m.nome}</span>
                        <span className="block text-xs text-muted">{tamanhoArquivo(m.tamanhoBytes)}</span>
                      </span>
                    </span>
                    <BotaoDownload
                      disponivel={Boolean(m.url)}
                      onBaixar={() => baixarMaterial(m)}
                      aria-label={`Baixar ${m.nome}`}
                    />
                  </li>
                ))}
              </ul>
            </Secao>
          )}

          {dados.atividades.length > 0 && (
            <Secao titulo="Atividades práticas">
              <ul className="space-y-3">
                {dados.atividades.map((a) => (
                  <li key={a.id}>
                    <AtividadeCard
                      atividade={a}
                      mostrarDescricao
                      onEntregue={(atualizada) =>
                        setDados((d) => ({
                          ...d,
                          atividades: d.atividades.map((x) => (x.id === a.id ? atualizada : x)),
                        }))
                      }
                    />
                  </li>
                ))}
              </ul>
            </Secao>
          )}
        </div>

        <aside>
          <ListaAulas cursoId={curso.id} aulas={aulas} aulaAtivaId={aula.id} progresso={curso.progresso} />
        </aside>
      </div>
    </Pagina>
  );
}
