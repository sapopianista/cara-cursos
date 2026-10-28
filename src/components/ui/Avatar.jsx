import { cn } from '../../lib/cn';

const PALETA = [
  'from-sky-500 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
  'from-fuchsia-500 to-purple-600',
  'from-rose-400 to-red-600',
  'from-cyan-400 to-blue-600',
  'from-lime-400 to-green-600',
  'from-slate-400 to-slate-600',
];

const TAMANHOS = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
};

/** Hash simples e determinístico: o mesmo nome sempre gera a mesma cor. */
const hash = (texto) => [...texto].reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 7);

export const iniciais = (nome = '') =>
  nome
    .replace(/^(Prof\.|Dra?\.)\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

/** Avatar com foto (quando a API enviar `foto`) ou iniciais coloridas. */
export default function Avatar({ nome, foto, tamanho = 'sm', className }) {
  const classes = cn('shrink-0 rounded-full ring-2 ring-surface', TAMANHOS[tamanho], className);

  if (foto) {
    return <img src={foto} alt="" loading="lazy" className={cn(classes, 'object-cover')} />;
  }

  return (
    <span
      aria-hidden
      className={cn(
        classes,
        'grid place-items-center bg-gradient-to-br font-bold text-white',
        PALETA[hash(nome) % PALETA.length],
      )}
    >
      {iniciais(nome)}
    </span>
  );
}
