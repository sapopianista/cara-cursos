import Card from '../ui/Card';

const Bloco = ({ className }) => <div className={`animate-pulse rounded-xl bg-surface2 ${className}`} />;

/** Esqueleto exibido enquanto o dashboard carrega (espelha o layout enxuto). */
export default function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-14 py-4" aria-busy="true" role="status">
      <span className="sr-only">Carregando dashboard…</span>
      <div className="space-y-3">
        <Bloco className="h-9 w-48" />
        <Bloco className="h-5 w-72 max-w-full" />
      </div>
      <Card className="!p-8">
        <Bloco className="h-56" />
      </Card>
      <div className="grid gap-12 lg:grid-cols-2">
        {[0, 1].map((coluna) => (
          <div key={coluna} className="space-y-3">
            <Bloco className="mb-5 h-7 w-52" />
            <Bloco className="h-24" />
            <Bloco className="h-24" />
            <Bloco className="h-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
