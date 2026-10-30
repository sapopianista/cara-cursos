import { Star } from 'lucide-react';

/** Nota média com estrela: ★ 4,9 (320) */
export default function Rating({ nota, total }) {
  const notaFmt = Number(nota).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs">
      <Star size={12} className="fill-warn text-warn" aria-hidden />
      <span className="sr-only">
        Nota {notaFmt} de 5{total != null && `, ${total} avaliações`}
      </span>
      <span aria-hidden className="font-semibold text-ink">
        {notaFmt}
      </span>
      {total != null && (
        <span aria-hidden className="text-muted">
          ({total})
        </span>
      )}
    </span>
  );
}
