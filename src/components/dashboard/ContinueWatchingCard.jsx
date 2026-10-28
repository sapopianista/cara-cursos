import { ArrowRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';
import Thumbnail from '../ui/Thumbnail';

/**
 * Ação principal da tela: retomar a aula de onde parou.
 * O pôster é um atalho de mouse; teclado e leitores de tela usam o botão.
 */
export default function ContinueWatchingCard({ aula }) {
  const destino = `/cursos/${aula.cursoId}`;

  return (
    <Card
      as="section"
      aria-labelledby="continuar-titulo"
      className="grid gap-8 !p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:!p-8"
    >
      <Link to={destino} tabIndex={-1} aria-hidden className="group block rounded-xl">
        <Thumbnail imagem={aula.imagem} tema={aula.tema} alt="" className="aspect-video rounded-xl">
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-onprimary shadow-glow transition-transform duration-200 group-hover:scale-110">
              <Play size={24} className="ml-0.5 fill-current" aria-hidden />
            </span>
          </span>
        </Thumbnail>
      </Link>

      <div>
        <p className="text-sm font-semibold text-primary">Continuar de onde parou</p>
        <h2 id="continuar-titulo" className="mt-2 text-2xl font-semibold leading-snug">
          {aula.titulo}
        </h2>
        <p className="mt-1 text-base text-muted">
          {aula.modulo} · {aula.categoria}
        </p>

        <ProgressBar
          valor={aula.percentualAssistido}
          altura="h-2"
          className="mt-6"
          rotulo="Progresso da aula"
        />
        <p className="mt-2 text-sm text-muted">
          {aula.percentualAssistido}% assistido · faltam {aula.tempoRestante}
        </p>

        <Link
          to={destino}
          className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-onprimary transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Continuar assistindo
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}
