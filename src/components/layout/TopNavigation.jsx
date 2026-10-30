import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Menu, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Notificacoes from './Notificacoes';
import UserMenu from './UserMenu';

/** Busca global de cursos: envia para /explorar?q=… (atalho: tecla "/"). */
function BuscaGlobal({ inicial }) {
  const navigate = useNavigate();
  const [termo, setTermo] = useState(inicial);
  const inputRef = useRef(null);

  useEffect(() => {
    const atalho = (e) => {
      const alvo = e.target;
      const digitando = alvo.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName);
      if (e.key === '/' && !digitando) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', atalho);
    return () => document.removeEventListener('keydown', atalho);
  }, []);

  const buscar = (e) => {
    e.preventDefault();
    const q = termo.trim();
    navigate(q ? `/explorar?q=${encodeURIComponent(q)}` : '/explorar');
  };

  return (
    <form role="search" onSubmit={buscar} className="relative w-full max-w-md">
      <label htmlFor="busca-global" className="sr-only">
        Buscar cursos
      </label>
      <Search
        size={16}
        aria-hidden
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle"
      />
      <input
        ref={inputRef}
        id="busca-global"
        type="search"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        placeholder="Buscar cursos"
        autoComplete="off"
        className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-sm sm:pr-12 text-ink transition-colors placeholder:text-subtle hover:border-track focus:border-primary focus:outline-none"
      />
      <kbd
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-line px-1.5 text-xs text-subtle sm:block"
      >
        /
      </kbd>
    </form>
  );
}

/**
 * Barra superior. Aluno: busca de cursos. Painel da empresa: nome da organização.
 */
export default function TopNavigation({ admin = false, onAbrirMenu }) {
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  // A busca da página Explorar e a global mostram o mesmo termo (key remonta o campo).
  const qUrl = pathname.startsWith('/explorar') ? (params.get('q') ?? '') : '';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-transparent bg-bg/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <Button
        variante="ghost"
        apenasIcone
        onClick={onAbrirMenu}
        aria-label="Abrir menu"
        className="lg:hidden"
      >
        <Menu size={20} aria-hidden />
      </Button>

      {admin ? (
        <p className="flex min-w-0 items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-medium">
          <Building2 size={16} className="shrink-0 text-muted" aria-hidden />
          <span className="truncate">{usuario?.empresa?.nome}</span>
        </p>
      ) : (
        <BuscaGlobal key={qUrl} inicial={qUrl} />
      )}

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Notificacoes />
        <UserMenu admin={admin} />
      </div>
    </header>
  );
}
