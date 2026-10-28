import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Play } from 'lucide-react';
import Thumbnail from '../ui/Thumbnail';
import ProgressBar from '../ui/ProgressBar';

export default function OngoingCourseCard({ curso }) {
  const { id, categoria, titulo, descricao, duracao, progresso, tema } = curso;
  const emAndamento = progresso > 0;

  return (
    <article className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface">
      <div>
        <Thumbnail tema={tema} className="relative aspect-[16/9] w-full">
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
            <Clock size={12} aria-hidden />
            {duracao}
          </span>
        </Thumbnail>

        <div className="p-5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-subtle">{categoria}</span>
            <span className="font-semibold text-accent">
              {emAndamento ? `${progresso}% concluído` : 'Não iniciado'}
            </span>
          </div>

          <h3 className="mt-2 line-clamp-2 text-base font-semibold text-ink">{titulo}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{descricao}</p>

          {emAndamento && (
            <div className="mt-4">
              <ProgressBar
                valor={progresso}
                rotulo={`Progresso em ${titulo}`}
                cor="primary"
                altura="h-2"
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-line px-5 py-4">
        <Link
          to={`/cursos/${id}`}
          className="inline-flex w-full items-center justify-between text-sm font-semibold text-primary hover:underline"
        >
          <span>{emAndamento ? 'Continuar curso' : 'Iniciar curso'}</span>
          {emAndamento ? (
            <Play size={15} className="fill-current" aria-hidden />
          ) : (
            <ArrowRight size={15} aria-hidden />
          )}
        </Link>
      </div>
    </article>
  );
}
