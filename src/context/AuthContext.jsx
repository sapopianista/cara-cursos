import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { definirAoNaoAutorizado, definirToken } from '../services/http';
import * as api from '../services/api';

const CHAVE_TOKEN = 'cara-cursos-token';
const AuthContext = createContext(null);

/** Papéis com acesso ao painel corporativo (o restante vê só a área do aluno). */
export const PAPEIS_ADMIN = ['admin', 'rh', 'lider', 'financeiro'];

/** Quais telas administrativas cada papel enxerga. */
export const PERMISSOES = {
  'admin.visao': ['admin', 'rh', 'lider'],
  'admin.colaboradores': ['admin', 'rh', 'lider'],
  'admin.relatorios': ['admin', 'rh', 'lider'],
  'admin.gestores': ['admin'],
  'admin.faturamento': ['admin', 'financeiro'],
  'admin.configuracoes': ['admin', 'rh'],
  'admin.ajuda': PAPEIS_ADMIN,
};

// "Lembrar neste dispositivo" -> localStorage; senão, sessionStorage (some ao fechar o navegador).
const lerToken = () => {
  try {
    return localStorage.getItem(CHAVE_TOKEN) ?? sessionStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
};
const salvarToken = (token, lembrar) => {
  try {
    localStorage.removeItem(CHAVE_TOKEN);
    sessionStorage.removeItem(CHAVE_TOKEN);
    if (token) (lembrar ? localStorage : sessionStorage).setItem(CHAVE_TOKEN, token);
  } catch {
    /* armazenamento indisponível: sessão vale só nesta aba */
  }
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // "verificando" enquanto valida um token salvo (evita mandar para o login à toa).
  const [status, setStatus] = useState(() => (lerToken() ? 'verificando' : 'anonimo'));

  const limparSessao = useCallback(() => {
    salvarToken(null);
    definirToken(null);
    setUsuario(null);
    setStatus('anonimo');
  }, []);

  useEffect(() => {
    definirAoNaoAutorizado(limparSessao);
    const token = lerToken();
    if (!token) return;
    definirToken(token);
    api
      .obterSessao(token)
      .then((u) => {
        setUsuario(u);
        setStatus('autenticado');
      })
      .catch(limparSessao);
  }, [limparSessao]);

  const entrar = useCallback(async ({ identificador, senha, lembrar }) => {
    const { token, usuario: u } = await api.entrar({ identificador, senha, lembrar });
    salvarToken(token, lembrar);
    definirToken(token);
    setUsuario(u);
    setStatus('autenticado');
    return u;
  }, []);

  const sair = useCallback(async () => {
    try {
      await api.sair();
    } finally {
      limparSessao();
    }
  }, [limparSessao]);

  const valor = useMemo(() => {
    const papel = usuario?.papel;
    return {
      usuario,
      status,
      autenticado: status === 'autenticado',
      ehGestor: PAPEIS_ADMIN.includes(papel),
      pode: (permissao) => Boolean(papel && PERMISSOES[permissao]?.includes(papel)),
      entrar,
      sair,
      atualizarUsuario: (parcial) => setUsuario((u) => ({ ...u, ...parcial })),
    };
  }, [usuario, status, entrar, sair]);

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.');
  return ctx;
}
