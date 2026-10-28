import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ShieldCheck, User, GraduationCap, UserRound } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Avatar + nome + painel de links da conta (padrão "disclosure", sem role=menu). */
export default function UserMenu({ nome = 'Tiago', admin = false }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);
  const botaoRef = useRef(null);
  const painelId = useId();

  // Fecha ao clicar fora ou apertar Esc (Esc devolve o foco ao botão).
  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => !ref.current?.contains(e.target) && setAberto(false);
    const esc = (e) => {
      if (e.key !== 'Escape') return;
      setAberto(false);
      botaoRef.current?.focus();
    };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  const itens = admin
    ? [
        { rotulo: 'Visão do aluno', to: '/', icone: GraduationCap },
        { rotulo: 'Sair / Alternar conta', to: '/login', icone: UserRound },
      ]
    : [
        { rotulo: 'Meu perfil', to: '/perfil', icone: UserRound },
        { rotulo: 'Visão corporativa (RH)', to: '/admin', icone: ShieldCheck },
        { rotulo: 'Sair / Alternar conta', to: '/login', icone: UserRound },
      ];

  return (
    <div ref={ref} className="relative">
      <button
        ref={botaoRef}
        type="button"
        aria-expanded={aberto}
        aria-controls={painelId}
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-surface"
      >
        <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-lilac/90 text-onprimary">
          <User size={18} />
        </span>
        <span className="hidden text-sm font-medium sm:block">
          <span className="sr-only">Conta de </span>
          {nome}
        </span>
        <ChevronDown
          size={14}
          aria-hidden
          className={cn('text-muted transition-transform', aberto && 'rotate-180')}
        />
      </button>

      {aberto && (
        <nav
          id={painelId}
          aria-label="Conta"
          className="animate-entrada absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-line bg-surface p-1.5 shadow-xl"
        >
          <ul>
            {itens.map(({ rotulo, to, icone: Icone }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={() => setAberto(false)}
                  className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface2 hover:text-ink"
                >
                  <Icone size={16} aria-hidden />
                  {rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
