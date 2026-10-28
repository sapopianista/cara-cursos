import { Bell, Building2, Menu, Search } from 'lucide-react';
import UserMenu from './UserMenu';

/**
 * Barra superior. `variant="aluno"` mostra a busca; `variant="admin"`
 * mostra o nome da empresa (como nos protótipos corporativos).
 */
export default function TopNavigation({ variant = 'aluno', onAbrirMenu }) {
  const admin = variant === 'admin';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-bg/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onAbrirMenu}
        aria-label="Abrir menu"
        className="rounded-lg p-2.5 text-muted hover:bg-surface hover:text-ink lg:hidden"
      >
        <Menu size={20} aria-hidden />
      </button>

      {admin ? (
        <p className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-medium">
          <Building2 size={16} className="text-muted" aria-hidden />
          Oscorp
        </p>
      ) : (
        <div role="search" className="relative w-full max-w-md">
          <label htmlFor="busca-global" className="sr-only">
            Buscar cursos
          </label>
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle"
          />
          <input
            id="busca-global"
            type="search"
            placeholder="Buscar cursos"
            className="w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-subtle transition-colors hover:border-subtle focus:border-primary"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-1 sm:gap-3">
        <button
          type="button"
          className="relative rounded-full p-2.5 text-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <Bell size={20} aria-hidden />
          <span className="sr-only">Notificações (há itens novos)</span>
          <span aria-hidden className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent ring-2 ring-bg" />
        </button>
        <UserMenu admin={admin} />
      </div>
    </header>
  );
}
