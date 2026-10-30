import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CHAVE = 'cara-cursos-tema';
const TemaContext = createContext(null);

const temaInicial = () => {
  try {
    return localStorage.getItem(CHAVE) ?? 'dark';
  } catch {
    return 'dark';
  }
};

/** Tema escuro (padrão) / claro, compartilhado por toda a aplicação e salvo no navegador. */
export function TemaProvider({ children }) {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    try {
      localStorage.setItem(CHAVE, tema);
    } catch {
      /* armazenamento indisponível: ignora */
    }
  }, [tema]);

  const alternar = useCallback(() => setTema((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const valor = useMemo(() => ({ tema, escuro: tema === 'dark', alternar, setTema }), [tema, alternar]);

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export function useTema() {
  const ctx = useContext(TemaContext);
  if (!ctx) throw new Error('useTema precisa estar dentro de <TemaProvider>.');
  return ctx;
}
