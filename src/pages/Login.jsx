import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Headset, IdCard, Lock, LogIn } from 'lucide-react';
import { loginCorporativo } from '../services/api';
import ThemeToggle from '../components/layout/ThemeToggle';

export default function Login() {
  const navigate = useNavigate();
  const [identificador, setIdentificador] = useState('tiago@gmail.com');
  const [senha, setSenha] = useState('12345678');
  const [lembrar, setLembrar] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  const aoSubmeter = async (evento) => {
    evento.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      await loginCorporativo({ identificador, senha, lembrar });
      navigate('/');
    } catch {
      setErro('Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-bg px-4 py-12 text-ink">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Cara Cursos • Ambiente Corporativo
          </p>
          <h1 className="mt-2 flex items-center justify-center gap-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            <LogIn size={24} className="text-primary" aria-hidden />
            Entrar na plataforma
          </h1>
          <p className="mt-2 text-sm text-muted">
            Acesse sua conta para continuar suas trilhas de capacitação.
          </p>
        </div>

        {erro && (
          <div
            role="alert"
            className="mt-5 rounded-xl border border-danger/40 bg-danger/10 p-3.5 text-center text-sm font-medium text-danger"
          >
            {erro}
          </div>
        )}

        <form onSubmit={aoSubmeter} className="mt-6 space-y-5">
          <div>
            <label htmlFor="identificador" className="mb-1.5 block text-sm font-medium text-ink">
              CPF ou e-mail corporativo
            </label>
            <div className="relative">
              <IdCard
                size={16}
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle"
              />
              <input
                id="identificador"
                name="username"
                type="text"
                autoComplete="username"
                required
                spellCheck="false"
                placeholder="Digite seu CPF ou e-mail"
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface2 py-3 pl-10 pr-4 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="current-password" className="mb-1.5 block text-sm font-medium text-ink">
              Senha
            </label>
            <div className="relative">
              <Lock
                size={16}
                aria-hidden
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle"
              />
              <input
                id="current-password"
                name="password"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface2 py-3 pl-10 pr-10 text-sm text-ink placeholder:text-subtle focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Exibir senha'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle transition-colors hover:text-ink"
              >
                {mostrarSenha ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={lembrar}
                onChange={(e) => setLembrar(e.target.checked)}
                className="h-4 w-4 rounded border-line bg-surface2 text-primary"
              />
              Lembrar neste dispositivo
            </label>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-onprimary transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {carregando ? (
              'Autenticando...'
            ) : (
              <>
                Entrar
                <ArrowRight size={16} aria-hidden />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-line pt-6 text-center text-sm">
          <p className="text-muted">Dificuldade para acessar sua conta?</p>
          <Link
            to="/suporte"
            className="mt-1.5 inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
          >
            <Headset size={15} aria-hidden />
            Contatar suporte da organização
          </Link>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 z-50 w-40">
        <ThemeToggle />
      </div>
    </main>
  );
}
