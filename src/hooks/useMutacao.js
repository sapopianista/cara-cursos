import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Executa uma ação que altera dados (POST/PUT/PATCH/DELETE) com estado de
 * envio e erro, incluindo erros por campo vindos da API (`erro.campos`).
 *
 *   const { executar, executando, erro, errosCampos, limpar } = useMutacao(criarColaborador, {
 *     onErro: (e) => toast.erro(e.message), // opcional: reage na hora da falha
 *   });
 *   const novo = await executar(dados); // devolve `undefined` se falhar
 */
export default function useMutacao(funcao, { onErro } = {}) {
  const [executando, setExecutando] = useState(false);
  const [erro, setErro] = useState(null);
  const funcaoRef = useRef(funcao);
  const onErroRef = useRef(onErro);
  useEffect(() => {
    funcaoRef.current = funcao;
    onErroRef.current = onErro;
  });

  const executar = useCallback(async (...args) => {
    setExecutando(true);
    setErro(null);
    try {
      return await funcaoRef.current(...args);
    } catch (e) {
      setErro(e);
      onErroRef.current?.(e);
      return undefined;
    } finally {
      setExecutando(false);
    }
  }, []);

  const limpar = useCallback(() => setErro(null), []);

  return { executar, executando, erro, errosCampos: erro?.campos ?? {}, limpar };
}
