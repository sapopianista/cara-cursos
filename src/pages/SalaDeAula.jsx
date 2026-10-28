import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import AulaVideoPlayer from '../components/sala/AulaVideoPlayer';
import PlaylistAulasCard from '../components/sala/PlaylistAulasCard';
import AtividadesCard from '../components/sala/AtividadesCard';

const DADOS_SALA_DE_AULA = {
  cursoAtual: {
    id: 1,
    titulo: 'Introdução à Comunicação Empresarial',
    instrutor: 'Tiago Vieira',
    cargoInstrutor: 'Especialista em Desenvolvimento Profissional e Liderança',
  },
  playlistAulas: {
    concluidas: 1,
    total: 7,
    aulas: [
      { id: 101, titulo: '01. Introdução', duracao: '03:36', status: 'concluido' },
      { id: 102, titulo: '02. O que é Comunicação Assertiva', duracao: '13:09', status: 'reproduzindo' },
      { id: 103, titulo: '03. Técnicas de Comunicação Assertiva', duracao: '03:36', status: 'pendente' },
      { id: 104, titulo: '04. Barreiras da Comunicação', duracao: '07:34', status: 'pendente' },
      { id: 105, titulo: '05. Benefícios da Comunicação Aberta', duracao: '05:12', status: 'pendente' },
      { id: 106, titulo: '06. Como Evitar Conflitos na Equipe', duracao: '08:45', status: 'pendente' },
      { id: 107, titulo: '07. Simulação Prática', duracao: '07:22', status: 'pendente' },
    ],
  },
  atividades: [
    {
      id: 1,
      titulo: '1. Aplicar técnicas de gestão de tempo',
      prazo: '2 dias restantes',
      status: 'pendente',
      descricao:
        'Crie um cronograma semanal priorizando tarefas urgentes e importantes com base na Matriz de Eisenhower.',
    },
    {
      id: 2,
      titulo: '2. Simulação de feedback construtivo',
      prazo: '3 dias restantes',
      status: 'pendente',
      descricao:
        'Redija uma resposta objetiva para alinhamento de expectativas em equipe usando Comunicação Não-Violenta.',
    },
  ],
};

export default function SalaDeAula() {
  const [aulaAtivaId, setAulaAtivaId] = useState(102);
  const [atividades, setAtividades] = useState(DADOS_SALA_DE_AULA.atividades);

  const { cursoAtual, playlistAulas } = DADOS_SALA_DE_AULA;
  const aulaSelecionada =
    playlistAulas.aulas.find((a) => a.id === aulaAtivaId) || playlistAulas.aulas[1];

  const handleSubmeterAtividade = (atvId) => {
    setAtividades((atuais) =>
      atuais.map((a) => (a.id === atvId ? { ...a, status: 'entregue' } : a)),
    );
  };

  return (
    <div className="animate-entrada mx-auto max-w-6xl space-y-8 py-4">
      <div>
        <Link
          to="/cursos"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden />
          Voltar para cursos
        </Link>
      </div>

      {/* Layout focado de 2 colunas: Vídeo/Atividades + Lista de Aulas */}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <AulaVideoPlayer
            aula={cursoAtual}
            onAvancarAula={() => setAulaAtivaId(103)}
          />

          <header className="border-b border-line pb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {aulaSelecionada.titulo}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink">
              {cursoAtual.titulo}
            </h1>
            <p className="mt-1 text-sm text-muted">
              <strong className="font-semibold text-ink">{cursoAtual.instrutor}</strong> •{' '}
              {cursoAtual.cargoInstrutor}
            </p>
          </header>

          {/* Material complementar */}
          <section aria-labelledby="material-apoio-titulo" className="space-y-3">
            <h2 id="material-apoio-titulo" className="text-lg font-semibold text-ink">
              Material de apoio
            </h2>
            <div className="flex items-center justify-between rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-primary" aria-hidden />
                <span className="text-sm font-medium text-ink">
                  Guia_Comunicacao_Assertiva.pdf
                </span>
              </div>
              <a
                href="#material-apoio-titulo"
                download="Guia_Comunicacao_Assertiva.pdf"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <Download size={15} aria-hidden />
                Baixar PDF
              </a>
            </div>
          </section>

          {/* Atividades práticas */}
          <section aria-labelledby="atividades-aula-titulo" className="space-y-4">
            <h2 id="atividades-aula-titulo" className="text-lg font-semibold text-ink">
              Atividades práticas
            </h2>
            <div className="space-y-4">
              {atividades.map((atv) => (
                <AtividadesCard
                  key={atv.id}
                  atividade={atv}
                  onSubmeter={handleSubmeterAtividade}
                />
              ))}
            </div>
          </section>
        </div>

        <aside aria-label="Lista de aulas do módulo">
          <PlaylistAulasCard
            playlist={playlistAulas}
            aulaAtivaId={aulaAtivaId}
            onSelecionarAula={setAulaAtivaId}
          />
        </aside>
      </div>
    </div>
  );
}
