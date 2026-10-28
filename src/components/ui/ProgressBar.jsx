import { useEffect, useState } from 'react';
import { cn } from '../../lib/cn';

const CORES = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  warn: 'bg-warn',
  muted: 'bg-subtle',
};

/** Barra de progresso acessível com animação de preenchimento. */
export default function ProgressBar({ valor, cor = 'primary', altura = 'h-1.5', rotulo, className }) {
  const pct = Math.min(100, Math.max(0, Number(valor) || 0));
  const [largura, setLargura] = useState(0);

  // Anima de 0 até o valor real quando o componente aparece.
  useEffect(() => {
    const id = requestAnimationFrame(() => setLargura(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={rotulo}
      className={cn('w-full overflow-hidden rounded-full bg-track', altura, className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-out', CORES[cor])}
        style={{ width: `${largura}%` }}
      />
    </div>
  );
}
