import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Play, Star } from 'lucide-react';

/**
 * Dados simulados para integração futura com a API REST Java/JDBC:
 * - GET /api/aluno/destaques
 */
const CURSO_PRINCIPAL = {
  id: 'curso-ia-corp',
  selo: 'Destaque do Mês',
  titulo: 'Inteligência Artificial Generativa para Produtividade e Negócios',
  descricao:
    'Aprenda a integrar ferramentas de IA nos fluxos diários da empresa, automatizando relatórios, estruturando análises e elevando sua eficiência operacional.',
  aulas: '12 aulas',
  duracao: '6 horas',
  instrutor: 'Dr. Roberto Guimarães',
  nota: '5.0',
  rota: '/cursos/1',
};

const CATEGORIAS = ['Todos', 'Hard Skills', 'Liderança', 'Soft Skills', 'Certificações'];

const CURSOS_SEMANA = [
  {
    id: 'destaque-1',
    categoria: 'Soft Skills',
    titulo: 'Comunicação Assertiva no Trabalho',
    descricao:
      'Desenvolva alinhamentos sem ruídos, técnicas de oratória corporativa e clareza na transmissão de diretrizes.',
    nota: '4.9',
    aulas: '17 aulas',
    duracao: '7h',
    imagem:
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80',
    rota: '/cursos/1',
  },
  {
    id: 'destaque-2',
    categoria: 'Hard Skills',
    titulo: 'Excel Avançado para Tomada de Decisão',
    descricao:
      'Modelagem, dashboards dinâmicos, PowerQuery e integração analítica para consolidações gerenciais.',
    nota: '5.0',
    aulas: '40 aulas',
    duracao: '9h',
    imagem:
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80',
    rota: '/cursos/2',
  },
  {
    id: 'destaque-3',
    categoria: 'Liderança',
    titulo: 'Resolução de Problemas com Design Thinking',
    descricao:
      'Metodologias práticas para desbloquear gargalos de processos e cocriar soluções orientadas ao usuário.',
    nota: '4.8',
    aulas: '8 aulas',
    duracao: '3h',
    imagem:
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
    rota: '/cursos/3',
  },
  {
    id: 'destaque-4',
    categoria: 'Soft Skills',
    titulo: 'Gestão do Tempo e Foco na Era Digital',
    descricao:
      'Eliminação de interrupções e priorização prática com métodos ágeis aplicados à rotina.',
    nota: '4.9',
    aulas: '10 aulas',
    duracao: '1h30min',
    imagem:
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=600&q=80',
    rota: '/cursos/4',
  },
  {
    id: 'destaque-5',
    categoria: 'Liderança',
    titulo: 'Liderança Situacional e Feedback Construtivo',
    descricao:
      'Abordagens adaptativas para gerir times diversos, conduzir reuniões 1-on-1 e alinhar metas.',
    nota: '5.0',
    aulas: '15 aulas',
    duracao: '4h',
    imagem:
      'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80',
    rota: '/trilhas',
  },
  {
    id: 'destaque-6',
    categoria: 'Certificações',
    titulo: 'Segurança da Informação e LGPD para Colaboradores',
    descricao:
      'Práticas seguras contra engenharia social, proteção de ativos digitais e conformidade com a legislação.',
    nota: '4.9',
    aulas: '6 aulas',
    duracao: '2h',
    imagem:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80',
    rota: '/cursos/1',
  },
];

export default function CursosDestaque() {
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');

  const cursosFiltrados =
    categoriaAtiva === 'Todos'
      ? CURSOS_SEMANA
      : CURSOS_SEMANA.filter((curso) => curso.categoria === categoriaAtiva);

  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-12 py-4">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Curadoria Acadêmica
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Cursos em Destaque
        </h1>
        <p className="max-w-2xl text-base text-muted">
          As formações mais bem avaliadas e lançamentos recentes selecionados para a sua evolução.
        </p>
      </header>

      {/* Destaque Principal (Ação primária da tela) */}
      <section
        aria-labelledby="destaque-mes-titulo"
        className="rounded-2xl border border-line bg-surface p-6 sm:p-8"
      >
        <span className="inline-block rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
          {CURSO_PRINCIPAL.selo}
        </span>

        <h2
          id="destaque-mes-titulo"
          className="mt-4 max-w-2xl text-xl font-bold text-ink sm:text-2xl"
        >
          {CURSO_PRINCIPAL.titulo}
        </h2>

        <p className="mt-2 max-w-2xl text-base text-muted">{CURSO_PRINCIPAL.descricao}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
          <span>{CURSO_PRINCIPAL.aulas}</span>
          <span aria-hidden>•</span>
          <span>{CURSO_PRINCIPAL.duracao}</span>
          <span aria-hidden>•</span>
          <span>Instrutor: {CURSO_PRINCIPAL.instrutor}</span>
          <span aria-hidden>•</span>
          <span className="inline-flex items-center gap-1 font-semibold text-warn">
            <Star size={15} className="fill-current" aria-hidden />
            {CURSO_PRINCIPAL.nota}
          </span>
        </div>

        <div className="mt-6">
          <Link
            to={CURSO_PRINCIPAL.rota}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-onprimary transition-colors hover:bg-primary-hover"
          >
            <Play size={16} className="fill-current" aria-hidden />
            Começar agora
          </Link>
        </div>
      </section>

      {/* Grade de Destaques da Semana */}
      <section aria-labelledby="destaques-semana-titulo" className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 id="destaques-semana-titulo" className="text-xl font-semibold text-ink">
            Destaques da semana
          </h2>

          <div
            role="group"
            aria-label="Filtrar destaques por categoria"
            className="flex flex-wrap gap-2"
          >
            {CATEGORIAS.map((cat) => {
              const ativo = categoriaAtiva === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setCategoriaAtiva(cat)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                    ativo
                      ? 'bg-primary text-onprimary'
                      : 'border border-line bg-surface text-muted hover:text-ink'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cursosFiltrados.map((curso) => (
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
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold uppercase tracking-wider text-subtle">
                      {curso.categoria}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-warn">
                      <Star size={14} className="fill-current" aria-hidden />
                      {curso.nota}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-semibold text-ink">{curso.titulo}</h3>
                  <p className="mt-1.5 text-sm text-muted line-clamp-2">{curso.descricao}</p>

                  <div className="mt-4 flex items-center gap-3 text-xs text-muted">
                    <span>{curso.aulas}</span>
                    <span aria-hidden>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} aria-hidden />
                      {curso.duracao}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-line px-5 py-4">
                <Link
                  to={curso.rota}
                  className="inline-flex w-full items-center justify-between text-sm font-semibold text-primary hover:underline"
                >
                  Acessar curso
                  <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
