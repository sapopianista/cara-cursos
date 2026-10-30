import { useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { getTrilha } from '../../services/api';
import { duracao, plural } from '../../lib/formatadores';
import { CTA_CURSO, NIVEL_CURSO } from '../../lib/rotulos';
import Pagina, { Secao } from '../../components/ui/Pagina';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import { GradeCursos } from '../../components/cursos/CursoCard';
import { ErroCarregamento, SkeletonPagina } from '../../components/ui/Estados';

export default function Trilha() {
  const { trilhaId } = useParams();
  const { dados: t, carregando, erro, recarregar } = useApi(() => getTrilha(trilhaId), [trilhaId]);
  const voltar = { to: '/trilhas', rotulo: 'Todas as trilhas' };

  if (carregando) return <SkeletonPagina largura="max-w-6xl" />;
  if (erro) {
    return (
      <Pagina titulo="Trilha" cabecalhoOculto voltar={voltar}>
        <ErroCarregamento erro={erro} onTentarNovamente={erro.status === 404 ? undefined : recarregar} />
      </Pagina>
    );
  }

  const proximo = t.cursos.find((c) => c.status !== 'concluido') ?? t.cursos[0];
  const concluidos = t.cursos.filter((c) => c.status === 'concluido').length;

  return (
    <Pagina titulo={t.titulo} descricao={t.descricao} voltar={voltar} largura="larga">
      <Card espacamento="lg" className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">
            {plural(t.totalCursos, 'curso')} · {duracao(t.duracaoMinutos)} · {NIVEL_CURSO[t.nivel]} ·{' '}
            {t.competencias.join(', ')}
          </p>
          <div className="mt-4 flex max-w-lg items-center gap-3">
            <ProgressBar valor={t.progresso} altura="h-2" rotulo="Progresso na trilha" />
            <span className="shrink-0 text-sm font-semibold tabular-nums">{t.progresso}%</span>
          </div>
          <p className="mt-2 text-sm text-muted">
            {concluidos} de {t.totalCursos} cursos concluídos
          </p>
        </div>
        <div className="shrink-0">
          <Button to={`/cursos/${proximo.id}`} tamanho="lg" iconeDireita={ArrowRight}>
            {CTA_CURSO[t.status]} trilha
          </Button>
          {t.status !== 'concluido' && <p className="mt-2 text-sm text-muted">Próximo: {proximo.titulo}</p>}
        </div>
      </Card>

      <Secao titulo="Cursos da trilha" descricao="Siga a ordem sugerida: cada curso aproveita o anterior.">
        <GradeCursos cursos={t.cursos} extras={(c) => ({ ordem: t.cursos.indexOf(c) + 1 })} />
      </Secao>
    </Pagina>
  );
}
