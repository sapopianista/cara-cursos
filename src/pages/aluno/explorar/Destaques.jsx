import { Play, Star } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { useTituloPagina } from '../../../hooks/utilitarios';
import { getDestaques } from '../../../services/api';
import { duracao } from '../../../lib/formatadores';
import { CTA_CURSO } from '../../../lib/rotulos';
import { GradeCursos } from '../../../components/cursos/CursoCard';
import { Secao } from '../../../components/ui/Pagina';
import Button from '../../../components/ui/Button';
import Thumbnail from '../../../components/ui/Thumbnail';
import { ErroCarregamento, SkeletonPagina } from '../../../components/ui/Estados';

export default function Destaques() {
  useTituloPagina('Destaques');
  const { dados, carregando, erro, recarregar } = useApi(getDestaques);

  if (carregando) return <SkeletonPagina cabecalho={false} largura="max-w-none" />;
  if (erro) return <ErroCarregamento erro={erro} onTentarNovamente={recarregar} />;

  const { principal, semana, lancamentos } = dados;

  return (
    <div className="space-y-12">
      <section
        aria-labelledby="destaque-mes"
        className="grid overflow-hidden rounded-2xl border border-line bg-surface shadow-card md:grid-cols-[1.1fr_1fr]"
      >
        <Thumbnail tema={principal.tema} imagem={principal.imagemUrl} className="min-h-48 md:min-h-full" />
        <div className="p-6 sm:p-8">
          <p className="text-sm font-semibold text-accent">Destaque do mês</p>
          <h2 id="destaque-mes" className="mt-2 text-xl font-bold leading-snug text-ink sm:text-2xl">
            {principal.titulo}
          </h2>
          <p className="mt-2 text-base text-muted">{principal.descricao}</p>
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>{principal.totalAulas} aulas</span>
            <span aria-hidden>·</span>
            <span>{duracao(principal.duracaoMinutos)}</span>
            <span aria-hidden>·</span>
            <span>com {principal.instrutor.nome}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1 font-semibold text-ink">
              <Star size={14} className="fill-warn text-warn" aria-hidden />
              {principal.nota.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
            </span>
          </p>
          <Button to={`/cursos/${principal.id}`} tamanho="lg" className="mt-6" iconeEsquerda={Play}>
            {CTA_CURSO[principal.status]} curso
          </Button>
        </div>
      </section>

      <Secao titulo="Mais bem avaliados">
        <GradeCursos cursos={semana} />
      </Secao>

      {lancamentos.length > 0 && (
        <Secao titulo="Lançamentos">
          <GradeCursos cursos={lancamentos} />
        </Secao>
      )}
    </div>
  );
}
