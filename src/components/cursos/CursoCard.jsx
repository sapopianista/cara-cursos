import { Link } from 'react-router-dom';
import { ArrowRight, Clock, PlayCircle } from 'lucide-react';
import { cn } from '../../lib/cn';
import { duracao } from '../../lib/formatadores';
import { CTA_CURSO, NIVEL_CURSO } from '../../lib/rotulos';
import Thumbnail from '../ui/Thumbnail';
import Rating from '../ui/Rating';
import ProgressBar from '../ui/ProgressBar';

/**
 * Card ÚNICO de curso usado em todo o catálogo (Explorar, Destaques, Para você,
 * Trilhas). O card inteiro é clicável (um único ponto de foco) e a chamada de
 * ação muda com o progresso: Começar → Continuar → Revisar.
 *
 * `motivo`: frase curta explicando por que o curso aparece (recomendações).
 * `ordem`: número da etapa (lista de cursos de uma trilha).
 */
export default function CursoCard({ curso, motivo, ordem, className, nivelTitulo = 3 }) {
  const {
    id,
    titulo,
    descricao,
    categoria,
    nivel,
    duracaoMinutos,
    totalAulas,
    nota,
    totalAvaliacoes,
    tema,
    imagemUrl,
  } = curso;
  const status = curso.status ?? 'nao_iniciado';
  const emAndamento = status === 'em_andamento';
  const Titulo = `h${nivelTitulo}`;

  return (
    <article
      className={cn(
        'card-interativo relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card focus-within:ring-2 focus-within:ring-primary/70',
        className,
      )}
    >
      <Thumbnail imagem={imagemUrl} tema={tema} className="aspect-[16/9] w-full">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
        />
        {ordem != null && (
          <span className="absolute left-3 top-3 grid h-7 min-w-7 place-items-center rounded-full bg-black/60 px-2 text-xs font-bold text-white">
            {ordem}
          </span>
        )}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/65 px-2 py-1 text-xs font-medium text-white">
          <Clock size={12} aria-hidden />
          {duracao(duracaoMinutos)}
        </span>
        {status === 'concluido' && (
          <span className="absolute bottom-3 left-3 rounded-lg bg-accent px-2 py-1 text-xs font-bold text-onaccent">
            Concluído
          </span>
        )}
      </Thumbnail>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="truncate font-semibold uppercase tracking-wider text-subtle">
            {categoria?.nome}
          </span>
          {nota != null && <Rating nota={nota} total={totalAvaliacoes} />}
        </div>

        <Titulo className="mt-2 line-clamp-2 text-base font-semibold leading-snug text-ink">
          {/* O link cobre o card inteiro (::after), mantendo um único tab-stop. */}
          <Link
            to={`/cursos/${id}`}
            className="after:absolute after:inset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            {titulo}
          </Link>
        </Titulo>

        {motivo ? (
          <p className="mt-1.5 text-sm font-medium text-accent">{motivo}</p>
        ) : (
          <p className="mt-1.5 line-clamp-2 text-sm text-muted">{descricao}</p>
        )}

        {emAndamento && (
          <div className="mt-4 flex items-center gap-3">
            <ProgressBar valor={curso.progresso} altura="h-1.5" rotulo={`Progresso em ${titulo}`} />
            <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">{curso.progresso}%</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-sm">
          <span className="text-muted">
            {NIVEL_CURSO[nivel]} · {totalAulas} aulas
          </span>
          <span aria-hidden className="inline-flex items-center gap-1 font-semibold text-primary">
            {emAndamento && <PlayCircle size={15} />}
            {CTA_CURSO[status]}
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}

/** Grade responsiva padrão de cards de curso. */
export function GradeCursos({ cursos, nivelTitulo, extras = () => ({}) }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {cursos.map((curso) => (
        <li key={curso.id}>
          <CursoCard curso={curso} nivelTitulo={nivelTitulo} {...extras(curso)} />
        </li>
      ))}
    </ul>
  );
}
