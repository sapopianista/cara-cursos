import { Link } from 'react-router-dom';
import { ArrowRight, Route } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { listarTrilhas } from '../../services/api';
import { duracao, plural } from '../../lib/formatadores';
import { CTA_CURSO, NIVEL_CURSO } from '../../lib/rotulos';
import Pagina from '../../components/ui/Pagina';
import Thumbnail from '../../components/ui/Thumbnail';
import ProgressBar from '../../components/ui/ProgressBar';
import { ErroCarregamento, SkeletonPagina, Vazio } from '../../components/ui/Estados';

export default function Trilhas() {
  const { dados, carregando, erro, recarregar } = useApi(listarTrilhas);

  return (
    <Pagina
      titulo="Trilhas"
      descricao="Sequências de cursos pensadas para desenvolver uma competência do início ao fim."
      largura="larga"
    >
      {carregando ? (
        <SkeletonPagina cabecalho={false} />
      ) : erro ? (
        <ErroCarregamento erro={erro} onTentarNovamente={recarregar} />
      ) : dados.length === 0 ? (
        <Vazio
          icone={Route}
          titulo="Nenhuma trilha disponível"
          descricao="Sua empresa ainda não publicou trilhas."
        />
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {dados.map((t) => (
            <li key={t.id}>
              <Link
                to={`/trilhas/${t.id}`}
                className="card-interativo group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card sm:flex-row"
              >
                <Thumbnail tema={t.tema} className="h-32 shrink-0 sm:h-auto sm:w-40" />
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-lg font-semibold text-ink">{t.titulo}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{t.descricao}</p>
                  <p className="mt-3 text-sm text-muted">
                    {plural(t.totalCursos, 'curso')} · {duracao(t.duracaoMinutos)} · {NIVEL_CURSO[t.nivel]}
                  </p>
                  {t.progresso > 0 && (
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar valor={t.progresso} rotulo={`Progresso na trilha ${t.titulo}`} />
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">
                        {t.progresso}%
                      </span>
                    </div>
                  )}
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-primary">
                    {CTA_CURSO[t.status]} trilha
                    <ArrowRight
                      size={16}
                      aria-hidden
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Pagina>
  );
}
