import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';

/**
 * Item da lista "Cursos em andamento": título (link) + progresso.
 * O link do título cobre o card inteiro (área de clique grande, um único
 * tab-stop e nome acessível claro).
 */
export default function CourseCard({ curso }) {
  const { id, titulo, progresso } = curso;

  return (
    <Card className="relative !p-5 transition-colors hover:bg-surface2 focus-within:ring-2 focus-within:ring-primary/70">
      <h3 className="text-base font-semibold leading-snug">
        <Link
          to={`/cursos/${id}`}
          className="after:absolute after:inset-0 after:rounded-2xl focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          {titulo}
        </Link>
      </h3>
      <div className="mt-4 flex items-center gap-4">
        <ProgressBar valor={progresso} altura="h-2" rotulo={`Progresso em ${titulo}`} />
        <span className="shrink-0 text-sm font-medium tabular-nums text-muted">{progresso}%</span>
      </div>
    </Card>
  );
}
