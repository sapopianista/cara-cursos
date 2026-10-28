import { Link } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import useApi from '../hooks/useApi';
import { getDashboardAluno } from '../services/api';
import WelcomeHeader from '../components/dashboard/WelcomeHeader';
import ContinueWatchingCard from '../components/dashboard/ContinueWatchingCard';
import CourseCard from '../components/dashboard/CourseCard';
import ActivityCard from '../components/dashboard/ActivityCard';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';

/**
 * Dashboard Pessoal (Área do Aluno).
 * Hierarquia: 1) saudação + meta  2) retomar aula (ação principal)
 *             3) cursos em andamento  4) próximas atividades.
 */
export default function DashboardAluno() {
  const { dados, carregando, erro } = useApi(getDashboardAluno);

  if (carregando) return <DashboardSkeleton />;

  if (erro || !dados) {
    return (
      <div
        role="alert"
        className="mx-auto mt-10 flex max-w-5xl items-center gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-5 text-base text-ink"
      >
        <CircleAlert size={20} className="shrink-0 text-danger" aria-hidden />
        Não foi possível carregar seu dashboard. Verifique a conexão com a API e tente novamente.
      </div>
    );
  }

  const { usuario, metaSemanal, continuarAssistindo, cursosEmAndamento, atividades } = dados;

  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-14 py-4">
      <WelcomeHeader nome={usuario.nome} {...metaSemanal} />

      <ContinueWatchingCard aula={continuarAssistindo} />

      <div className="grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="cursos-andamento">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 id="cursos-andamento" className="text-xl font-semibold">
              Cursos em andamento
            </h2>
            <Link to="/cursos" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Ver todos
            </Link>
          </div>
          <ul className="space-y-3">
            {cursosEmAndamento.map((curso) => (
              <li key={curso.id}>
                <CourseCard curso={curso} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="atividades-pendentes">
          <h2 id="atividades-pendentes" className="mb-5 text-xl font-semibold">
            Próximas atividades
          </h2>
          <ul className="space-y-3">
            {atividades.map((atividade) => (
              <li key={atividade.id}>
                <ActivityCard atividade={atividade} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
