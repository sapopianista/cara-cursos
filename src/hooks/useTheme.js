import { useCallback, useEffect, useState } from 'react';

const CHAVE = 'cara-cursos-tema';

/** Tema escuro (padrão) / claro, persistido em localStorage. */
export default function useTheme() {
  const [tema, setTema] = useState(() => {
    try {
      return localStorage.getItem(CHAVE) ?? 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    try {
      localStorage.setItem(CHAVE, tema);
    } catch {
      /* armazenamento indisponível: ignora */
    }
  }, [tema]);

  const alternar = useCallback(() => setTema((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return { tema, escuro: tema === 'dark', alternar };
}
