import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';

/**
 * Abas que são rotas (cada aba tem URL própria, funciona com "voltar" e links).
 * abas: [{ to, rotulo, end? }]
 */
export default function AbasNavegacao({ abas, rotulo, className }) {
  return (
    <nav aria-label={rotulo} className={cn('-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0', className)}>
      <ul className="flex min-w-max gap-6 border-b border-line">
        {abas.map((aba) => (
          <li key={aba.to}>
            <NavLink
              to={aba.to}
              end={aba.end}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center pb-3 text-sm font-semibold transition-colors',
                  'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:origin-left after:rounded-full after:bg-primary after:transition-transform after:duration-300',
                  isActive ? 'text-primary after:scale-x-100' : 'text-muted after:scale-x-0 hover:text-ink',
                )
              }
            >
              {aba.rotulo}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
