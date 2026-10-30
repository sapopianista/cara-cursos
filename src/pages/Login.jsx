import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, FlaskConical, IdCard, Lock, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { useTituloPagina } from '../hooks/utilitarios';
import { contasDemo } from '../services/api';
import { obrigatorio, validar } from '../lib/validacao';
import Button from '../components/ui/Button';
import { Campo, Checkbox, CampoTexto, classeControle } from '../components/ui/Campo';

const REGRAS = {
  identificador: [obrigatorio('Informe seu e-mail corporativo.')],
  senha: [obrigatorio('Informe sua senha.')],
};

export default function Login() {
  useTituloPagina('Entrar');
  const { entrar } = useAuth();
  const { escuro, alternar } = useTema();
  const navigate = useNavigate();
  const location = useLocation();

  const [valores, setValores] = useState({ identificador: '', senha: '' });
  const [lembrar, setLembrar] = useState(true);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');

  const alterar = (campo) => (e) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }));
    if (erros[campo]) setErros((x) => ({ ...x, [campo]: undefined }));
  };

  const aoSubmeter = async (evento) => {
    evento.preventDefault();
    const novosErros = validar(valores, REGRAS);
    setErros(novosErros);
    setErroGeral('');
    if (Object.keys(novosErros).length) return;

    setCarregando(true);
    try {
      await entrar({ ...valores, lembrar });
      navigate(location.state?.de?.pathname ?? '/', { replace: true });
    } catch (erro) {
      setErroGeral(erro.message || 'Não foi possível entrar. Tente novamente.');
      setCarregando(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12 text-ink">
      <button
        type="button"
        onClick={alternar}
        aria-label={escuro ? 'Usar tema claro' : 'Usar tema escuro'}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
      >
        {escuro ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
      </button>

      <div className="w-full max-w-md animate-entrada">
        <p className="text-center text-2xl font-bold tracking-tight">
          Cara <span className="text-lilac">Cursos</span>
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Entrar</h1>
          <p className="mt-1 text-sm text-muted">Use o acesso fornecido pela sua empresa.</p>

          {erroGeral && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-danger/40 bg-danger/10 p-3.5 text-sm font-medium text-danger"
            >
              {erroGeral}
            </div>
          )}

          <form onSubmit={aoSubmeter} noValidate className="mt-6 space-y-5">
            <CampoTexto
              rotulo="E-mail corporativo"
              obrigatorio
              icone={IdCard}
              name="username"
              type="email"
              autoComplete="username"
              spellCheck="false"
              autoFocus
              value={valores.identificador}
              onChange={alterar('identificador')}
              erro={erros.identificador}
            />

            <Campo rotulo="Senha" obrigatorio erro={erros.senha}>
              {(props) => (
                <div className="relative">
                  <Lock
                    size={16}
                    aria-hidden
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle"
                  />
                  <input
                    {...props}
                    name="password"
                    type={mostrarSenha ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={valores.senha}
                    onChange={alterar('senha')}
                    className={classeControle(erros.senha, 'pl-10 pr-11')}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={mostrarSenha}
                    className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-subtle transition-colors hover:text-ink"
                  >
                    {mostrarSenha ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
                  </button>
                </div>
              )}
            </Campo>

            <Checkbox
              rotulo="Manter conectado neste dispositivo"
              checked={lembrar}
              onChange={(e) => setLembrar(e.target.checked)}
            />

            <Button
              type="submit"
              tamanho="lg"
              blocoInteiro
              carregando={carregando}
              iconeDireita={carregando ? undefined : ArrowRight}
            >
              {carregando ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          {contasDemo.length > 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-line p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <FlaskConical size={15} aria-hidden className="text-warn" />
                Ambiente de demonstração
              </p>
              <p className="mt-1 text-xs text-muted">
                Escolha uma conta. Qualquer senha com 6 ou mais caracteres funciona.
              </p>
              <ul className="mt-3 space-y-2">
                {contasDemo.map((conta) => (
                  <li key={conta.email}>
                    <button
                      type="button"
                      onClick={() => {
                        setValores({ identificador: conta.email, senha: 'demo1234' });
                        setErros({});
                        setErroGeral('');
                      }}
                      className="w-full rounded-lg bg-surface2 px-3 py-2 text-left text-sm transition-colors hover:bg-track/60"
                    >
                      <span className="block font-medium text-ink">{conta.email}</span>
                      <span className="block text-xs text-muted">{conta.descricao}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Problemas para entrar? Fale com o RH ou com o suporte de TI da sua empresa.
        </p>
      </div>
    </main>
  );
}
