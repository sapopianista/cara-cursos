import { useState } from 'react';
import { CheckCircle2, Clock } from 'lucide-react';

export default function AtividadesCard({ atividade, onSubmeter }) {
  const { id, titulo, descricao, prazo, status } = atividade;
  const [entregue, setEntregue] = useState(status === 'entregue');

  const handleEntrega = () => {
    if (entregue) return;
    setEntregue(true);
    if (onSubmeter) onSubmeter(id);
  };

  return (
    <article className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-ink">{titulo}</h3>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-warn/15 px-2.5 py-1 text-xs font-semibold text-warn">
          <Clock size={13} aria-hidden />
          Prazo: {prazo}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted">{descricao}</p>

      <div className="mt-4 border-t border-line pt-4">
        <button
          type="button"
          onClick={handleEntrega}
          disabled={entregue}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
            entregue
              ? 'bg-accent/15 text-accent'
              : 'bg-primary text-onprimary hover:bg-primary-hover'
          }`}
        >
          {entregue ? (
            <>
              <CheckCircle2 size={15} aria-hidden />
              Atividade entregue
            </>
          ) : (
            'Marcar como concluída'
          )}
        </button>
      </div>
    </article>
  );
}
