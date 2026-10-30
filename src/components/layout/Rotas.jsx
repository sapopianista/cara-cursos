import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoaderCircle, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTituloPagina } from '../../hooks/utilitarios';
import Button from '../ui/Button';

function VerificandoSessao() {
  return (
    <div role="status" className="grid min-h-screen place-items-center bg-bg text-muted">
      <span className="flex items-center gap-2 text-sm">
        <LoaderCircle size={18} className="animate-spin" aria-hidden />
        Verificando sua sessão…
      </span>
    </div>
  );
}

/** Exige login. Sem sessão, vai para /login e volta para a página pedida depois. */
export function RotaProtegida() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'verificando') return <VerificandoSessao />;
  if (status === 'anonimo') return <Navigate to="/login" replace state={{ de: location }} />;
  return <Outlet />;
}

/** Login só para quem ainda não entrou. */
export function RotaAnonima() {
  const { status } = useAuth();
  if (status === 'verificando') return <VerificandoSessao />;
  if (status === 'autenticado') return <Navigate to="/" replace />;
  return <Outlet />;
}

/** Painel da empresa: só papéis administrativos. */
export function RotaGestor() {
  const { ehGestor } = useAuth();
  return ehGestor ? <Outlet /> : <AcessoNegado inicio="/" />;
}

/** Tela administrativa específica (ex.: faturamento só para admin/financeiro). */
export function RotaPermissao({ permissao, children }) {
  const { pode } = useAuth();
  return pode(permissao) ? children : <AcessoNegado inicio="/admin" />;
}

export function AcessoNegado({ inicio = '/' }) {
  useTituloPagina('Acesso restrito');
  return (
    <div className="grid min-h-[60vh] animate-entrada place-items-center px-4">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-warn/15 text-warn">
          <Lock size={24} aria-hidden />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted">
          Seu perfil não tem permissão para abrir esta página. Se precisar dela, peça acesso a um
          administrador da sua empresa.
        </p>
        <Button to={inicio} variante="secondary" className="mt-6">
          Voltar ao início
        </Button>
      </div>
    </div>
  );
}
