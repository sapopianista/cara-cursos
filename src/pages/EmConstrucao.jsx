import { Link } from 'react-router-dom';
import { ArrowLeft, Hammer } from 'lucide-react';

/** Tela provisória para rotas ainda não implementadas. */
export default function EmConstrucao({ titulo = 'Em construção' }) {
  return (
    <div className="animate-entrada grid min-h-[60vh] place-items-center">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Hammer size={26} aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-bold">{titulo}</h1>
        <p className="mt-2 text-sm text-muted">
          Esta tela ainda será construída a partir do protótipo. O layout base já está pronto para recebê-la.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface2"
        >
          <ArrowLeft size={15} aria-hidden />
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
