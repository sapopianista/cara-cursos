import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import Thumbnail from '../ui/Thumbnail';
import Rating from '../ui/Rating';

export default function CatalogCourseCard({ curso }) {
  const { id, categoria, titulo, descricao, duracao, nota, totalAvaliacoes, nivel, tema } = curso;

  return (
    <article className="flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface">
      <div>
        <Thumbnail tema={tema} className="relative aspect-[16/10] w-full">
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
            <Clock size={12} aria-hidden />
            {duracao}
          </span>
        </Thumbnail>

        <div className="p-5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wider text-subtle">{categoria}</span>
            <Rating nota={nota} total={totalAvaliacoes} />
          </div>

          <h2 className="mt-2 line-clamp-2 text-base font-semibold text-ink">{titulo}</h2>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{descricao}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line px-5 py-4">
        <span className="text-xs font-medium text-muted">{nivel}</span>
        <Link
          to={`/cursos/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Iniciar curso
          <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </article>
  );
}
