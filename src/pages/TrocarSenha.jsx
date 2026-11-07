import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTituloPagina } from '../hooks/utilitarios';
import useMutacao from '../hooks/useMutacao';
import { alterarSenha } from '../services/api';
import { obrigatorio, senha, TAMANHO_MINIMO_SENHA, validar } from '../lib/validacao';
import Button from '../components/ui/Button';
import { CampoTexto } from '../components/ui/Campo';

const REGRAS = {
  senhaAtual: [obrigatorio('Informe a senha atual.')],
  novaSenha: [senha()],
  confirmacao: [(v, todos) => (v === todos.novaSenha ? '' : 'As senhas não conferem.')],
};

/**
 * Troca de senha. Obrigatória no primeiro acesso (ou depois que o RH redefine a senha):
 * enquanto `usuario.trocarSenha` for verdadeiro, as outras telas redirecionam para cá.
 */
export default function TrocarSenha() {
  useTituloPagina('Trocar senha');
  const { usuario, atualizarUsuario, sair } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const obrigatoria = Boolean(usuario?.trocarSenha);
  const [valores, setValores] = useState({ senhaAtual: '', novaSenha: '', confirmacao: '' });
  const [errosLocais, setErrosLocais] = useState({});
  const { executar, executando, erro, errosCampos } = useMutacao(alterarSenha);

  const erros = { ...errosCampos, ...errosLocais };
  const alterar = (campo) => (e) => {
    setValores((v) => ({ ...v, [campo]: e.target.value }));
    setErrosLocais((x) => ({ ...x, [campo]: undefined }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(valores, REGRAS);
    setErrosLocais(encontrados);
    if (Object.keys(encontrados).length) return;
    const atualizado = await executar({ senhaAtual: valores.senhaAtual, novaSenha: valores.novaSenha });
    if (!atualizado) return;
    atualizarUsuario({ trocarSenha: false });
    toast.sucesso('Senha alterada.');
    navigate(obrigatoria ? '/' : '/perfil', { replace: true });
  };

  return (
    <main className="grid min-h-screen place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-md animate-entrada">
        <p className="text-center text-2xl font-bold tracking-tight">
          Cara <span className="text-lilac">Cursos</span>
        </p>

        <div className="mt-6 rounded-2xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <KeyRound size={20} aria-hidden />
          </span>
          <h1 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
            {obrigatoria ? 'Crie sua senha' : 'Trocar senha'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {obrigatoria
              ? `Olá, ${usuario.nome.split(' ')[0]}! Você entrou com uma senha provisória do RH. Escolha uma senha só sua para continuar.`
              : 'Informe a senha atual e escolha uma nova.'}
          </p>

          {erro && !Object.keys(errosCampos).length && (
            <p
              role="alert"
              className="mt-5 rounded-xl border border-danger/40 bg-danger/10 p-3.5 text-sm font-medium text-danger"
            >
              {erro.message}
            </p>
          )}

          <form onSubmit={enviar} noValidate className="mt-6 space-y-5">
            {/* Ajuda gerenciadores de senha a associar a nova senha à conta certa. */}
            <input
              type="email"
              name="username"
              value={usuario?.email ?? ''}
              autoComplete="username"
              readOnly
              hidden
            />
            <CampoTexto
              rotulo={obrigatoria ? 'Senha provisória' : 'Senha atual'}
              obrigatorio
              icone={Lock}
              type="password"
              autoComplete="current-password"
              autoFocus
              value={valores.senhaAtual}
              onChange={alterar('senhaAtual')}
              erro={erros.senhaAtual}
            />
            <CampoTexto
              rotulo="Nova senha"
              obrigatorio
              icone={Lock}
              type="password"
              autoComplete="new-password"
              value={valores.novaSenha}
              onChange={alterar('novaSenha')}
              erro={erros.novaSenha}
              dica={`Pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`}
            />
            <CampoTexto
              rotulo="Confirme a nova senha"
              obrigatorio
              icone={Lock}
              type="password"
              autoComplete="new-password"
              value={valores.confirmacao}
              onChange={alterar('confirmacao')}
              erro={erros.confirmacao}
            />
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              {obrigatoria ? (
                <Button variante="ghost" onClick={sair} disabled={executando}>
                  Sair
                </Button>
              ) : (
                <Button variante="ghost" to="/perfil" disabled={executando}>
                  Voltar
                </Button>
              )}
              <Button type="submit" carregando={executando}>
                Salvar senha
              </Button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
