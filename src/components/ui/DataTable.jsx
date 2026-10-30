import { cn } from '../../lib/cn';

/**
 * Tabela padrão. Abaixo de 760px de largura cada linha vira um card com o
 * rótulo da coluna ao lado do valor (CSS .tabela-responsiva em index.css).
 *
 * colunas: [{ id, titulo, render: (linha) => node, className?, alinhar?: 'direita', oculto?: bool }]
 */
export default function DataTable({
  colunas,
  linhas,
  chave = 'id',
  legenda,
  vazio = 'Nenhum registro encontrado.',
  atualizando = false,
  className,
}) {
  const visiveis = colunas.filter((c) => !c.oculto);
  const rotulos = Object.fromEntries(
    visiveis.map((c, i) => [`--label-${i + 1}`, `"${c.tituloCurto ?? c.titulo}"`]),
  );

  return (
    <div
      className={cn(
        'tabela-wrapper rounded-2xl border border-line bg-surface shadow-card transition-opacity duration-200',
        atualizando && 'opacity-60',
        className,
      )}
      aria-busy={atualizando || undefined}
    >
      <table className="tabela-responsiva w-full text-left text-sm" style={rotulos}>
        {legenda && <caption className="sr-only">{legenda}</caption>}
        <thead className="border-b border-line bg-surface2/60 text-xs font-semibold uppercase tracking-wider text-subtle">
          <tr>
            {visiveis.map((c) => (
              <th
                key={c.id}
                scope="col"
                className={cn('px-5 py-3.5', c.alinhar === 'direita' && 'text-right', c.classeCabecalho)}
              >
                {c.tituloOculto ? <span className="sr-only">{c.titulo}</span> : c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {linhas.length === 0 ? (
            <tr>
              <td data-vazio colSpan={visiveis.length} className="px-5 py-10 text-center text-muted">
                {vazio}
              </td>
            </tr>
          ) : (
            linhas.map((linha) => (
              <tr key={linha[chave]} className="transition-colors hover:bg-surface2/40">
                {visiveis.map((c) => (
                  <td
                    key={c.id}
                    className={cn(
                      'px-5 py-3.5 align-middle',
                      c.alinhar === 'direita' && 'text-right',
                      c.className,
                    )}
                  >
                    {c.render ? c.render(linha) : linha[c.id]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
