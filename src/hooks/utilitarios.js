import { useEffect, useRef, useState } from 'react';
import { NOME_APP } from '../config/ambiente';

/** Valor que só atualiza após `ms` sem mudanças (busca enquanto digita). */
export function useDebounce(valor, ms = 300) {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setAtrasado(valor), ms);
    return () => clearTimeout(id);
  }, [valor, ms]);
  return atrasado;
}

/** Define o <title> da aba: "Colaboradores · Cara Cursos". `false` não altera. */
export function useTituloPagina(titulo) {
  useEffect(() => {
    if (titulo === false) return;
    document.title = titulo ? `${titulo} · ${NOME_APP}` : NOME_APP;
  }, [titulo]);
}

/**
 * Popover simples (menu da conta, notificações): fecha ao clicar fora ou com
 * Esc (devolvendo o foco ao botão que abriu).
 */
export function usePopover() {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef(null);
  const gatilhoRef = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    const fora = (e) => !containerRef.current?.contains(e.target) && setAberto(false);
    const esc = (e) => {
      if (e.key !== 'Escape') return;
      setAberto(false);
      gatilhoRef.current?.focus();
    };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  return { aberto, setAberto, alternar: () => setAberto((v) => !v), containerRef, gatilhoRef };
}

/**
 * Mantém um elemento montado durante a animação de saída.
 * `visivel` controla a intenção; `montado` diz se ainda deve renderizar;
 * `saindo` permite aplicar a classe de animação de saída.
 */
export function usePresenca(visivel, duracaoSaidaMs = 160) {
  const [montado, setMontado] = useState(visivel);
  const [anterior, setAnterior] = useState(visivel);
  // Ajuste de estado durante o render (padrão recomendado pelo React para "derivar" de props).
  if (visivel !== anterior) {
    setAnterior(visivel);
    if (visivel) setMontado(true);
  }
  const saindo = montado && !visivel;

  useEffect(() => {
    if (!saindo) return undefined;
    const id = setTimeout(() => setMontado(false), duracaoSaidaMs);
    return () => clearTimeout(id);
  }, [saindo, duracaoSaidaMs]);

  return { montado, saindo };
}
