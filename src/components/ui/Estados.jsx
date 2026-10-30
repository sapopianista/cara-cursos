import { CircleAlert, Inbox, LoaderCircle, RotateCw } from 'lucide-react';
import { cn } from '../../lib/cn';
import Button from './Button';

/** Bloco de carregamento com brilho. */
export function Skeleton({ className }) {
  return <div aria-hidden className={cn('skeleton', className)} />;
}

/** Envoltório anunciado aos leitores de tela enquanto a tela carrega. */
export function Carregando({ rotulo = 'Carregando…', children, className }) {
  return (
    <div role="status" aria-busy="true" className={cn('space-y-8 py-4', className)}>
      <span className="sr-only">{rotulo}</span>
      {children}
    </div>
  );
}

/** Carregamento de tela cheia (antes de existir layout, ex.: abrindo o login). */
export function CarregandoTela() {
  return (
    <div role="status" className="grid min-h-screen place-items-center bg-bg text-muted">
      <LoaderCircle size={22} className="animate-spin" aria-hidden />
      <span className="sr-only">Carregando…</span>
    </div>
  );
}

/** Esqueletos prontos que espelham os layouts mais comuns. */
export function SkeletonPagina({ variante = 'grade', largura = 'max-w-5xl', cabecalho = true }) {
  return (
    <Carregando className={cn('mx-auto w-full', largura, !cabecalho && 'py-0')}>
      {cabecalho && (
        <div className="space-y-3">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
      )}
      {variante === 'grade' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
              <Skeleton className="aspect-[16/9] rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}
      {variante === 'tabela' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <div className="space-y-2 rounded-2xl border border-line bg-surface p-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </>
      )}
      {variante === 'lista' && (
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}
      {variante === 'formulario' && (
        <div className="space-y-5 rounded-2xl border border-line bg-surface p-6">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10" />
            </div>
          ))}
        </div>
      )}
    </Carregando>
  );
}

/** Falha ao carregar, com opção de tentar de novo. */
export function ErroCarregamento({ erro, mensagem, onTentarNovamente, className }) {
  return (
    <div
      role="alert"
      className={cn(
        'mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-danger/30 bg-danger/5 px-6 py-10 text-center',
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-danger/15 text-danger">
        <CircleAlert size={22} aria-hidden />
      </span>
      <p className="mt-4 text-base font-semibold text-ink">
        {mensagem ?? 'Não foi possível carregar esta página.'}
      </p>
      {erro?.message && <p className="mt-1 text-sm text-muted">{erro.message}</p>}
      {onTentarNovamente && (
        <Button variante="secondary" className="mt-5" iconeEsquerda={RotateCw} onClick={onTentarNovamente}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

/** Lista/busca sem resultados. */
export function Vazio({ icone: Icone = Inbox, titulo, descricao, acao, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-12 text-center',
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full bg-surface2 text-muted">
        <Icone size={22} aria-hidden />
      </span>
      <p className="mt-4 text-base font-semibold text-ink">{titulo}</p>
      {descricao && <p className="mt-1 max-w-sm text-sm text-muted">{descricao}</p>}
      {acao && <div className="mt-5">{acao}</div>}
    </div>
  );
}
