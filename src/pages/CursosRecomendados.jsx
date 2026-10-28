import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Play } from 'lucide-react';

/**
 * Dados simulados para integração futura com a API REST Java/JDBC:
 * - GET /api/aluno/recomendados
 */
const PERFIL_ALUNO = {
  nome: 'Tiago',
  cargo: 'Analista de Operações',
  departamento: 'Operações e Gestão de Projetos',
};

const RECOMENDADOS_CARGO = [
  {
    id: 'rec-cargo-1',
    compatibilidade: '98% compatível',
    duracao: '3h',
    aulas: '14 aulas',
    nivel: 'Intermediário',
    titulo: 'Metodologias Ágeis: Scrum e Kanban no Dia a Dia',
    descricao:
      'Aplique rituais ágeis, gestão de gargalos operacionais e fluxos contínuos no contexto de equipes dinâmicas.',
    imagem:
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
    rota: '/cursos/1',
  },
  {
    id: 'rec-cargo-2',
    compatibilidade: '95% compatível',
    duracao: '5h',
    aulas: '20 aulas',
    nivel: 'Intermediário',
    titulo: 'Otimização de Processos com Lean Six Sigma',
    descricao:
      'Reduza desperdícios, mapeie cadeias de valor e elimine variabilidade nas operações corporativas.',
    imagem:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
    rota: '/cursos/2',
  },
  {
    id: 'rec-cargo-3',
    compatibilidade: '92% compatível',
    duracao: '4h30min',
    aulas: '18 aulas',
    nivel: 'Avançado',
    titulo: 'Power BI e Dashboards Operacionais para Decisão',
    descricao:
      'Construa relatórios executivos automatizados, painéis de indicadores e acompanhamento de produtividade.',
    imagem:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
    rota: '/cursos/3',
  },
];

const RECOMENDADOS_CONTINUIDADE = [
  {
    id: 'rec-cont-1',
    afinidade: '94% de afinidade',
    meta: '2h45min • 10 aulas',
    titulo: 'Oratória e Apresentações de Alto Impacto',
    descricao:
      'Técnicas de síntese executiva, apresentação de dados e condução objetiva de reuniões.',
    rota: '/cursos/1',
  },
  {
    id: 'rec-cont-2',
    afinidade: '91% de afinidade',
    meta: '3h10min • 12 aulas',
    titulo: 'Negociação e Resolução de Conflitos',
    descricao:
      'Estratégias de alinhamento entre áreas, conciliação de prioridades e construção de consenso.',
    rota: '/cursos/2',
  },
  {
    id: 'rec-cont-3',
    afinidade: '89% de afinidade',
    meta: '1h50min • 8 aulas',
    titulo: 'Escrita Corporativa: E-mails, Propostas e Relatórios Claros',
    descricao:
      'Redija sem ambiguidades, reduza ruídos de comunicação e estruture documentos objetivos.',
    rota: '/cursos/3',
  },
];

export default function CursosRecomendados() {
  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-12 py-4">
      <header className="border-b border-line pb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Plano de Desenvolvimento Individual
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Recomendados para {PERFIL_ALUNO.nome}
        </h1>
        <p className="mt-2 max-w-2xl text-base text-muted">
          Sugestões selecionadas com base no seu cargo de{' '}
          <strong className="font-semibold text-ink">{PERFIL_ALUNO.cargo}</strong> e nos seus
          cursos concluídos recentemente.
        </p>
      </header>

      {/* Seção 1: Alinhados ao Cargo */}
      <section aria-labelledby="recomendados-cargo-titulo" className="space-y-5">
        <div>
          <h2 id="recomendados-cargo-titulo" className="text-xl font-semibold text-ink">
            Alinhados ao seu cargo • {PERFIL_ALUNO.departamento}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Prioridades técnicas para o seu momento profissional.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {RECOMENDADOS_CARGO.map((curso) => (
            <li
              key={curso.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <div>
                <img
                  src={curso.imagem}
                  alt=""
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />

                <div className="p-5">
                  <span className="inline-block rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                    {curso.compatibilidade}
                  </span>

                  <h3 className="mt-3 text-base font-semibold text-ink">{curso.titulo}</h3>
                  <p className="mt-1.5 text-sm text-muted line-clamp-3">{curso.descricao}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Play size={13} aria-hidden />
                      {curso.aulas}
                    </span>
                    <span aria-hidden>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} aria-hidden />
                      {curso.duracao}
                    </span>
                    <span aria-hidden>•</span>
                    <span>{curso.nivel}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-line px-5 py-4">
                <Link
                  to={curso.rota}
                  className="inline-flex w-full items-center justify-between text-sm font-semibold text-primary hover:underline"
                >
                  Iniciar curso
                  <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Seção 2: Continuidade de Competências */}
      <section aria-labelledby="continuidade-titulo" className="space-y-5">
        <div>
          <h2 id="continuidade-titulo" className="text-xl font-semibold text-ink">
            Próximos passos após “Comunicação Eficaz”
          </h2>
          <p className="mt-1 text-sm text-muted">
            Cursos complementares para aprofundar o que você já concluiu.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {RECOMENDADOS_CONTINUIDADE.map((curso) => (
            <li
              key={curso.id}
              className="flex flex-col justify-between rounded-2xl border border-line bg-surface p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-primary">{curso.afinidade}</span>
                  <span className="text-muted">{curso.meta}</span>
                </div>

                <h3 className="mt-3 text-base font-semibold text-ink">{curso.titulo}</h3>
                <p className="mt-1.5 text-sm text-muted">{curso.descricao}</p>
              </div>

              <div className="mt-5 border-t border-line pt-4">
                <Link
                  to={curso.rota}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  Ver curso
                  <ArrowRight size={15} aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
