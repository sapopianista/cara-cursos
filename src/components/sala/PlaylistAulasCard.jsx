import { CheckCircle2, PlayCircle } from 'lucide-react';

export default function PlaylistAulasCard({ playlist, aulaAtivaId, onSelecionarAula }) {
  const { aulas, concluidas, total } = playlist;

  return (
    <section
      aria-labelledby="playlist-aulas-titulo"
      className="rounded-2xl border border-line bg-surface p-5"
    >
      <div className="flex items-center justify-between border-b border-line pb-4">
        <h2 id="playlist-aulas-titulo" className="text-base font-semibold text-ink">
          Aulas do módulo
        </h2>
        <span className="rounded-full bg-surface2 px-2.5 py-1 text-xs font-semibold text-muted">
          {concluidas} de {total} concluídas
        </span>
      </div>

      <ol className="mt-4 space-y-1.5">
        {aulas.map((aula) => {
          const selecionada = aula.id === aulaAtivaId;
          const concluida = aula.status === 'concluido';

          return (
            <li key={aula.id}>
              <button
                type="button"
                aria-current={selecionada ? 'step' : undefined}
                onClick={() => onSelecionarAula(aula.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left text-sm transition-colors ${
                  selecionada
                    ? 'bg-primary/15 font-semibold text-primary'
                    : 'text-ink hover:bg-surface2'
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {concluida ? (
                    <CheckCircle2 size={17} className="shrink-0 text-accent" aria-hidden />
                  ) : selecionada ? (
                    <PlayCircle size={17} className="shrink-0 text-primary" aria-hidden />
                  ) : (
                    <span
                      aria-hidden
                      className="h-4 w-4 shrink-0 rounded-full border border-subtle"
                    />
                  )}
                  <span className="truncate">{aula.titulo}</span>
                </span>

                <span className="shrink-0 font-mono text-xs text-muted">{aula.duracao}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
