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
import useApi from '../../../hooks/useApi';
import { useTituloPagina } from '../../../hooks/utilitarios';
import { listarAreas } from '../../../services/api';
import { duracao, plural } from '../../../lib/formatadores';
import { ErroCarregamento, SkeletonPagina } from '../../../components/ui/Estados';

/** A API envia um "slug" de ícone; o front escolhe o desenho. */
const ICONES = {
  code: Code2,
  users: Users2,
  heart: HeartHandshake,
  trending: TrendingUp,
  building: Building2,
  megaphone: Megaphone,
  pen: PenTool,
  boxes: Boxes,
};

/** Cada área leva ao catálogo já filtrado (?area=…). */
export default function Areas() {
  useTituloPagina('Cursos por área');
  const { dados, carregando, erro, recarregar } = useApi(listarAreas);

  if (carregando) return <SkeletonPagina variante="lista" cabecalho={false} largura="max-w-none" />;
  if (erro) return <ErroCarregamento erro={erro} onTentarNovamente={recarregar} />;

  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {dados.map((area) => {
        const Icone = ICONES[area.icone] ?? Boxes;
        return (
          <li key={area.id}>
            <Link
              to={`/explorar?area=${area.id}`}
              className="card-interativo group flex h-full flex-col rounded-2xl border border-line bg-surface p-6 shadow-card"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <Icone size={22} aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-ink">{area.nome}</h2>
              <p className="mt-1 text-sm text-muted">
                {plural(area.totalCursos, 'curso')} · {duracao(area.duracaoMinutos)} de conteúdo
              </p>
              <p className="mt-3 text-sm text-muted">{area.competencias.join(' · ')}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-primary">
                Ver cursos
                <ArrowRight
                  size={16}
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
