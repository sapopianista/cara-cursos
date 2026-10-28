/**
 * Gráfico de rosca em SVG (progresso circular segmentado).
 * `segmentos`: [{ valor: number, cor: string (qualquer cor CSS) }]
 * Os filhos são renderizados no centro do anel.
 *
 * Interatividade opcional: `ativo` (índice destacado) + `onAtivoChange(i|null)`.
 */
export default function DonutChart({
  segmentos,
  tamanho = 180,
  espessura = 14,
  folga = 5,
  rotulo,
  ativo = null,
  onAtivoChange,
  children,
}) {
  const raio = (tamanho - espessura) / 2;
  const centro = tamanho / 2;
  const circunferencia = 2 * Math.PI * raio;
  const total = segmentos.reduce((soma, s) => soma + s.valor, 0) || 1;
  const interativo = typeof onAtivoChange === 'function';

  let acumulado = 0;
  const arcos = segmentos.map((s, i) => {
    if (s.valor <= 0) return null;
    const comprimento = (s.valor / total) * circunferencia;
    // As pontas arredondadas (round caps) "comem" `espessura` do arco;
    // descontamos isso para manter uma folga visual constante entre segmentos.
    const visivel = Math.max(comprimento - folga - espessura, 0.01);
    const deslocamento = -(acumulado + (folga + espessura) / 2);
    acumulado += comprimento;

    const destacado = ativo === i;
    const esmaecido = ativo !== null && !destacado;

    return (
      <circle
        key={i}
        cx={centro}
        cy={centro}
        r={raio}
        fill="none"
        stroke={s.cor}
        strokeWidth={destacado ? espessura + 4 : espessura}
        strokeLinecap="round"
        strokeDasharray={`${visivel} ${circunferencia - visivel}`}
        strokeDashoffset={deslocamento}
        opacity={esmaecido ? 0.45 : 1}
        className={interativo && !s.inerte ? 'cursor-pointer transition-all duration-200' : undefined}
        onMouseEnter={interativo && !s.inerte ? () => onAtivoChange(i) : undefined}
        onMouseLeave={interativo && !s.inerte ? () => onAtivoChange(null) : undefined}
      />
    );
  });

  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }} role="img" aria-label={rotulo}>
      <svg
        width={tamanho}
        height={tamanho}
        viewBox={`0 0 ${tamanho} ${tamanho}`}
        className="-rotate-90 overflow-visible"
      >
        {arcos}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}
