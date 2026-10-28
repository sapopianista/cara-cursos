/** Cabeçalho de seção: ícone + título + badge opcional + ação à direita. */
export default function SectionHeader({ icone: Icone, corIcone = 'text-warn', titulo, badge, acao }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {Icone && <Icone size={17} className={corIcone} aria-hidden />}
        <h2 className="truncate text-base font-semibold sm:text-lg">{titulo}</h2>
        {badge}
      </div>
      {acao}
    </div>
  );
}
