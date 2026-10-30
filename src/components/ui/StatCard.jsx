import { cn } from '../../lib/cn';

/**
 * Indicador numérico. Use dentro de <dl> (StatGrid).
 *   <StatCard rotulo="Colaboradores ativos" valor="21" detalhe="de 24 cadastrados" />
 */
export function StatCard({ rotulo, valor, detalhe, tomDetalhe = 'muted', destaque = false, className }) {
  return (
    <div className={cn('rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5', className)}>
      <dt className="text-sm font-medium text-muted">{rotulo}</dt>
      <dd
        className={cn(
          'mt-1 text-2xl font-bold tabular-nums tracking-tight sm:mt-1.5 sm:text-3xl',
          destaque ? 'text-accent' : 'text-ink',
        )}
      >
        {valor}
      </dd>
      {detalhe && (
        <dd
          className={cn(
            'mt-1 text-xs sm:text-sm',
            { muted: 'text-muted', sucesso: 'text-accent', alerta: 'text-warn', erro: 'text-danger' }[
              tomDetalhe
            ],
          )}
        >
          {detalhe}
        </dd>
      )}
    </div>
  );
}

export function StatGrid({ colunas = 3, className, children, atualizando = false }) {
  return (
    <dl
      aria-busy={atualizando || undefined}
      className={cn(
        'grid gap-3 transition-opacity duration-200 sm:gap-4',
        colunas === 3 && 'sm:grid-cols-3',
        colunas === 4 && 'grid-cols-2 lg:grid-cols-4',
        atualizando && 'opacity-60',
        className,
      )}
    >
      {children}
    </dl>
  );
}
