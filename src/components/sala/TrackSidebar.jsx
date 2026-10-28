import { useState } from 'react';
import { Route, Search } from 'lucide-react';
import Card from '../ui/Card';
import Thumbnail from '../ui/Thumbnail';

export default function TrackSidebar({ trilha, cursoAtivoId, onSelecionarCurso }) {
  const [busca, setBusca] = useState('');

  const cursosFiltrados = trilha.cursos.filter((c) =>
    c.titulo.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <Card className="flex flex-col !p-4">
      {/* Topo com Título da Trilha */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
          <Route size={16} className="text-primary" />
          {trilha.nomeTrilha}
        </h2>
      </div>

      {/* Busca rápida de cursos na trilha */}
      <div className="relative mt-3">
        <Search
          size={14}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
        />
        <input
          type="search"
          placeholder="Buscar curso..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface2/60 py-2 pl-8 pr-3 text-xs text-ink placeholder:text-subtle focus:border-primary/50 focus:outline-none"
        />
      </div>

      {/* Lista de Cursos na Trilha */}
      <div className="mt-3 space-y-2 overflow-y-auto max-h-[580px] pr-1">
        {cursosFiltrados.map((curso) => {
          const ativo = curso.id === cursoAtivoId;

          return (
            <button
              key={curso.id}
              type="button"
              onClick={() => onSelecionarCurso(curso.id)}
              className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all ${
                ativo
                  ? 'border border-primary/50 bg-primary/10 shadow-sm'
                  : 'border border-transparent hover:bg-surface2'
              }`}
            >
              <Thumbnail
                tema={curso.tema}
                className="h-10 w-10 shrink-0 rounded-lg shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-xs font-semibold ${ativo ? 'text-primary' : 'text-ink'}`}>
                  {curso.titulo}
                </p>
                <span className="text-xs text-muted">{curso.aulas}</span>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
