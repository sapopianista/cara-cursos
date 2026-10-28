import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  Building2,
  Code2,
  HeartHandshake,
  Megaphone,
  PenTool,
  TrendingUp,
  Users2,
} from 'lucide-react';

/**
 * Dados simulados para integração futura com a API REST Java/JDBC:
 * - GET /api/aluno/areas
 */
const DEPARTAMENTOS = [
  {
    id: 'tech',
    nome: 'Tecnologia e Engenharia de Software',
    cursosQtd: 28,
    horas: 140,
    icone: Code2,
    competencias: ['Front-end', 'DevOps', 'Arquitetura Cloud', 'IA Aplicada'],
  },
  {
    id: 'lideranca',
    nome: 'Liderança e Gestão Estratégica',
    cursosQtd: 22,
    horas: 95,
    icone: Users2,
    competencias: ['Gestão de Pessoas', 'OKRs', 'Negociação', 'Cultura Ágil'],
  },
  {
    id: 'rh',
    nome: 'Recursos Humanos e Gestão de Talentos',
    cursosQtd: 16,
    horas: 70,
    icone: HeartHandshake,
    competencias: ['People Analytics', 'Recrutamento', 'Clima Organizacional', 'Diversidade'],
  },
  {
    id: 'vendas',
    nome: 'Vendas e Negociação Corporativa',
    cursosQtd: 19,
    horas: 82,
    icone: TrendingUp,
    competencias: ['Inside Sales', 'B2B Enterprise', 'CRM', 'Spin Selling'],
  },
  {
    id: 'financas',
    nome: 'Finanças e Controladoria',
    cursosQtd: 14,
    horas: 65,
    icone: Building2,
    competencias: ['FP&A', 'Valuation', 'Excel Avançado', 'Compliance'],
  },
  {
    id: 'marketing',
    nome: 'Marketing e Crescimento',
    cursosQtd: 21,
    horas: 90,
    icone: Megaphone,
    competencias: ['SEO', 'Mídia Paga', 'Comunidades', 'Posicionamento'],
  },
  {
    id: 'design',
    nome: 'Design e Experiência do Usuário (UI/UX)',
    cursosQtd: 18,
    horas: 85,
    icone: PenTool,
    competencias: ['Figma', 'Design System', 'Pesquisa com Usuários', 'Acessibilidade'],
  },
  {
    id: 'operacoes',
    nome: 'Operações e Logística Corporativa',
    cursosQtd: 12,
    horas: 55,
    icone: Boxes,
    competencias: ['Supply Chain', 'Lean Six Sigma', 'Gestão de Riscos', 'Processos'],
  },
];

export default function CursosPorArea() {
  return (
    <div className="animate-entrada mx-auto max-w-5xl space-y-10 py-4">
      <header className="border-b border-line pb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Categorias e Departamentos
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Cursos por Área de Atuação
        </h1>
        <p className="mt-2 max-w-2xl text-base text-muted">
          Escolha um departamento para explorar as trilhas e formações disponíveis na organização.
        </p>
      </header>

      <section aria-labelledby="departamentos-titulo">
        <h2 id="departamentos-titulo" className="sr-only">
          Departamentos disponíveis
        </h2>

        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTAMENTOS.map((dep) => {
            const Icone = dep.icone;
            return (
              <li key={dep.id}>
                <Link
                  to="/cursos"
                  className="group flex h-full flex-col justify-between rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-primary"
                >
                  <div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Icone size={22} aria-hidden />
                    </div>

                    <h3 className="mt-4 text-lg font-semibold text-ink group-hover:text-primary">
                      {dep.nome}
                    </h3>

                    <p className="mt-1 text-sm text-muted">
                      {dep.cursosQtd} cursos • {dep.horas}h de conteúdo
                    </p>

                    <ul
                      aria-label={`Tópicos de ${dep.nome}`}
                      className="mt-4 flex flex-wrap gap-1.5"
                    >
                      {dep.competencias.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-lg border border-line bg-surface2 px-2.5 py-1 text-xs font-medium text-muted"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <span className="mt-6 inline-flex items-center gap-2 border-t border-line pt-4 text-sm font-semibold text-primary">
                    Explorar área
                    <ArrowRight
                      size={16}
                      aria-hidden
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
