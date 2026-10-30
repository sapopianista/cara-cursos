import { useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, GraduationCap, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../context/AuthContext';
import { usePopover } from '../../hooks/utilitarios';
import { inicioAdmin } from '../../config/navigation';
import Avatar from '../ui/Avatar';

const NOME_PAPEL = {
  admin: 'Administrador',
  rh: 'Gestor de RH',
  lider: 'Líder de equipe',
  financeiro: 'Financeiro',
  colaborador: 'Colaborador',
};

const classeItem =
  'flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface2 hover:text-ink';

/** Avatar + nome + painel da conta (padrão "disclosure"). */
export default function UserMenu({ admin = false }) {
  const { usuario, ehGestor, pode, sair } = useAuth();
  const { aberto, setAberto, alternar, containerRef, gatilhoRef } = usePopover();
  const navigate = useNavigate();
  const painelId = useId();

  if (!usuario) return null;
  const primeiroNome = usuario.nome.split(' ')[0];

  const fazerLogout = async () => {
    setAberto(false);
    await sair();
    navigate('/login', { replace: true });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={gatilhoRef}
        type="button"
        aria-expanded={aberto}
        aria-controls={painelId}
        onClick={alternar}
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition-colors hover:bg-surface"
      >
        <Avatar nome={usuario.nome} tamanho="md" />
        <span className="hidden text-sm font-medium sm:block">
          <span className="sr-only">Conta de </span>
          {primeiroNome}
        </span>
        <ChevronDown
          size={14}
          aria-hidden
          className={cn('text-muted transition-transform duration-200', aberto && 'rotate-180')}
        />
      </button>

      {aberto && (
        <div
          id={painelId}
          className="absolute right-0 top-full z-50 mt-2 w-64 animate-pop-in rounded-xl border border-line bg-surface p-1.5 shadow-popover"
        >
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="truncate text-sm font-semibold text-ink">{usuario.nome}</p>
            <p className="truncate text-xs text-muted">{usuario.email}</p>
            <p className="mt-1 text-xs text-subtle">
              {NOME_PAPEL[usuario.papel]} · {usuario.empresa?.nome}
            </p>
          </div>
          <nav aria-label="Conta" className="pt-1.5">
            <ul>
              <li>
                <Link to="/perfil" onClick={() => setAberto(false)} className={classeItem}>
                  <UserRound size={16} aria-hidden />
                  Meu perfil
                </Link>
              </li>
              {ehGestor && (
                <li>
                  {admin ? (
                    <Link to="/" onClick={() => setAberto(false)} className={classeItem}>
                      <GraduationCap size={16} aria-hidden />
                      Ir para a área do aluno
                    </Link>
                  ) : (
                    <Link to={inicioAdmin(pode)} onClick={() => setAberto(false)} className={classeItem}>
                      <LayoutDashboard size={16} aria-hidden />
                      Ir para o painel da empresa
                    </Link>
                  )}
                </li>
              )}
              <li className="mt-1.5 border-t border-line pt-1.5">
                <button type="button" onClick={fazerLogout} className={cn(classeItem, 'hover:text-danger')}>
                  <LogOut size={16} aria-hidden />
                  Sair
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
