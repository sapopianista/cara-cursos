import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CircleAlert, Sparkles } from 'lucide-react';
import useApi from '../hooks/useApi';
import { getDescobrir } from '../services/api';
import OngoingCourseCard from '../components/descobrir/OngoingCourseCard';

export default function Descobrir() {
  const { dados, carregando, erro } = useApi(getDescobrir);

  if (carregando) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-4 animate-pulse" aria-busy="true">
        <div className="h-20 w-1/3 rounded-xl bg-surface2" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-56 rounded-2xl bg-surface2" />
          <div className="h-56 rounded-2xl bg-surface2" />
        </div>
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
        Não foi possível carregar a página Descobrir.
      </div>
    );
  }

  const { destaques, cursosEmAndamento } = dados;

  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-12 py-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Portal de Aprendizado
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Descobrir</h1>
        <p className="max-w-2xl text-base text-muted">
          Explore trilhas estruturadas e cursos práticos para desenvolver suas competências.
        </p>
      </header>

      {/* Caminhos principais: Trilhas de Carreira e Cursos Individuais */}
      <section aria-labelledby="caminhos-aprendizado-titulo">
        <h2 id="caminhos-aprendizado-titulo" className="sr-only">
          Modalidades de estudo
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                <Sparkles size={13} aria-hidden />
                {destaques.trilha.tag}
              </span>

              <h3 className="mt-4 text-xl font-bold text-ink">{destaques.trilha.titulo}</h3>
              <p className="mt-1 text-sm font-medium text-accent">{destaques.trilha.subtitulo}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {destaques.trilha.descricao}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
              <Link
                to={destaques.trilha.link}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-onprimary transition-colors hover:bg-primary-hover"
              >
                Ver trilhas
                <ArrowRight size={16} aria-hidden />
              </Link>
              <span className="text-xs text-muted">{destaques.trilha.totalDisponiveis}</span>
            </div>
          </article>

          <article className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface2 px-3 py-1 text-xs font-semibold text-muted">
                <BookOpen size={13} aria-hidden />
                {destaques.avulso.tag}
              </span>

              <h3 className="mt-4 text-xl font-bold text-ink">{destaques.avulso.titulo}</h3>
              <p className="mt-1 text-sm font-medium text-warn">{destaques.avulso.subtitulo}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {destaques.avulso.descricao}
              </p>
            </div>

            <div className="mt-6 border-t border-line pt-4">
              <Link
                to={destaques.avulso.link}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface2 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
              >
                Ver catálogo completo
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          </article>
        </div>
      </section>

      {/* Cursos em andamento */}
      <section aria-labelledby="titulo-em-andamento" className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="titulo-em-andamento" className="text-xl font-semibold text-ink">
            Continuar estudando
          </h2>
          <Link
            to="/area-do-aluno"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Ir para área do aluno
          </Link>
        </div>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cursosEmAndamento.slice(0, 3).map((curso) => (
            <li key={curso.id}>
              <OngoingCourseCard curso={curso} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
