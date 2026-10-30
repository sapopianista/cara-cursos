import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useTituloPagina } from '../../hooks/utilitarios';

const LARGURAS = {
  estreita: 'max-w-3xl',
  padrao: 'max-w-5xl',
  larga: 'max-w-6xl',
};

/**
 * Estrutura padrão de toda tela: largura, título (h1 + <title> da aba),
 * descrição curta opcional, ações à direita e link de voltar.
 *
 *   <Pagina titulo="Colaboradores" descricao="..." acoes={<Button>…</Button>}>
 */
export default function Pagina({
  titulo,
  tituloAba,
  descricao,
  acoes,
  voltar,
  largura = 'padrao',
  cabecalhoOculto = false,
  className,
  children,
}) {
  useTituloPagina(tituloAba ?? titulo);

  return (
    <div className={cn('mx-auto w-full animate-entrada space-y-8 py-4', LARGURAS[largura], className)}>
      {voltar && (
        <Link
          to={voltar.to}
          className="-mb-4 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden />
          {voltar.rotulo}
        </Link>
      )}

      {!cabecalhoOculto && (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{titulo}</h1>
            {descricao && <p className="mt-2 max-w-2xl text-base text-muted">{descricao}</p>}
          </div>
          {acoes && <div className="flex shrink-0 flex-wrap items-center gap-2">{acoes}</div>}
        </header>
      )}

      {children}
    </div>
  );
}

/**
 * Seção com título h2, descrição e ação opcional ("Ver todos").
 */
export function Secao({ titulo, descricao, acao, tituloOculto = false, children, className, id }) {
  const idTitulo =
    id ??
    `secao-${String(titulo)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^\w]+/g, '-')}`;
  return (
    <section aria-labelledby={idTitulo} className={cn('space-y-4', className)}>
      <div className={cn('flex items-end justify-between gap-4', tituloOculto && 'sr-only')}>
        <div className="min-w-0">
          <h2 id={idTitulo} className="text-lg font-semibold text-ink sm:text-xl">
            {titulo}
          </h2>
          {descricao && <p className="mt-1 text-sm text-muted">{descricao}</p>}
        </div>
        {acao && <div className="shrink-0">{acao}</div>}
      </div>
      {children}
    </section>
  );
}
