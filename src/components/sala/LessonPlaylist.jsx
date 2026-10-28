import { CheckCircle2, PlayCircle, Clock, BookOpen } from 'lucide-react';
import Card from '../ui/Card';

export default function LessonPlaylist({ playlist, aulaAtivaId, onSelecionarAula }) {
  const { aulas, concluidas, total } = playlist;

  return (
    <Card className="flex flex-col !p-4">
      {/* Topo do Card de Aulas */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
          <BookOpen size={16} className="text-primary" />
          Aulas
        </h2>
        <span className="text-xs font-semibold text-accent">
          {concluidas}/{total} Concluídas
        </span>
      </div>

      {/* Lista de Aulas */}
      <ul className="mt-3 space-y-1.5" role="list">
        {aulas.map((aula) => {
          const selecionada = aula.id === aulaAtivaId;
          const concluida = aula.status === 'concluido';
          const reproduzindo = aula.status === 'reproduzindo' || selecionada;

          return (
            <li key={aula.id}>
              <button
                type="button"
                onClick={() => onSelecionarAula(aula.id)}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors ${
                  reproduzindo
                    ? 'border border-accent/40 bg-accent/10 font-medium text-ink'
                    : 'border border-transparent hover:bg-surface2 text-muted hover:text-ink'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {concluida ? (
                    <CheckCircle2 size={16} className="shrink-0 text-primary fill-primary/20" />
                  ) : reproduzindo ? (
                    <PlayCircle size={16} className="shrink-0 text-accent fill-accent/20" />
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full border border-subtle/50" />
                  )}

                  <div className="min-w-0">
                    <p className={`truncate ${reproduzindo ? 'text-accent font-semibold' : ''}`}>
                      {aula.titulo}
                    </p>
                    <span className="text-xs text-muted">
                      {reproduzindo ? '• Em reprodução' : concluida ? 'Concluído' : aula.tipo}
                    </span>
                  </div>
                </div>

                <span className="shrink-0 font-mono text-xs text-muted ml-2">
                  {aula.duracao}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
