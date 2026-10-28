import { useMemo, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import useApi from '../hooks/useApi';
import { getCursos } from '../services/api';
import CatalogCourseCard from '../components/cursos/CatalogCourseCard';

const CATEGORIAS = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'comunicação', rotulo: 'Comunicação' },
  { valor: 'gestão', rotulo: 'Gestão e Liderança' },
  { valor: 'análise', rotulo: 'Análise de Dados' },
  { valor: 'organização', rotulo: 'Produtividade' },
  { valor: 'soft', rotulo: 'Soft Skills' },
];

export default function TodosCursos() {
  const { dados: cursos, carregando, erro } = useApi(getCursos);
  const [categoria, setCategoria] = useState('todas');

  const cursosFiltrados = useMemo(() => {
    if (!cursos) return [];
    if (categoria === 'todas') return cursos;
    return cursos.filter((c) => c.categoria.toLowerCase().includes(categoria.toLowerCase()));
  }, [cursos, categoria]);

  if (carregando) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-4 animate-pulse" aria-busy="true">
        <div className="h-16 w-1/3 rounded-xl bg-surface2" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 rounded-2xl bg-surface2" />
          ))}
        </div>
      </div>
    );
  }

  if (erro || !cursos) {
    return (
      <div
        role="alert"
        className="mx-auto mt-10 flex max-w-5xl items-center gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-5 text-base text-ink"
      >
        <CircleAlert size={20} className="shrink-0 text-danger" aria-hidden />
        Não foi possível carregar o catálogo de cursos.
      </div>
    );
  }

  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-10 py-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Catálogo Corporativo
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Todos os Cursos</h1>
        <p className="max-w-2xl text-base text-muted">
          Explore o acervo de formações práticas disponíveis para o seu desenvolvimento.
        </p>
      </header>

      {/* Filtro único por categoria */}
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-5 sm:flex-row sm:items-center">
        <div
          role="group"
          aria-label="Filtrar cursos por categoria"
          className="flex flex-wrap gap-2"
        >
          {CATEGORIAS.map((item) => {
            const ativo = categoria === item.valor;
            return (
              <button
                key={item.valor}
                type="button"
                aria-pressed={ativo}
                onClick={() => setCategoria(item.valor)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                  ativo
                    ? 'bg-primary text-onprimary'
                    : 'border border-line bg-surface text-muted hover:text-ink'
                }`}
              >
                {item.rotulo}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-muted" aria-live="polite">
          {cursosFiltrados.length} {cursosFiltrados.length === 1 ? 'curso' : 'cursos'}
        </p>
      </div>

      {/* Lista de cursos */}
      {cursosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface p-10 text-center">
          <p className="text-base font-semibold text-ink">Nenhum curso encontrado nesta categoria.</p>
          <button
            type="button"
            onClick={() => setCategoria('todas')}
            className="mt-4 rounded-xl border border-line bg-surface2 px-4 py-2 text-sm font-medium text-ink hover:border-primary"
          >
            Mostrar todos os cursos
          </button>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cursosFiltrados.map((curso) => (
            <li key={curso.id}>
              <CatalogCourseCard curso={curso} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
