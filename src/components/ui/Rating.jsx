import { Star } from 'lucide-react';

/** Nota média com estrela: ★ 4.9 (320) */
export default function Rating({ nota, total }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs" aria-label={`Nota ${nota} de 5, ${total} avaliações`}>
      <Star size={12} className="fill-warn text-warn" aria-hidden />
      <span className="font-semibold text-ink">{Number(nota).toFixed(1)}</span>
      {total != null && <span className="text-muted">({total})</span>}
    </span>
  );
}
