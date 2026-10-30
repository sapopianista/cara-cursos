import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Carrega dados de uma função de serviço.
 *
 *   const { dados, carregando, atualizando, erro, recarregar, setDados } =
 *     useApi(() => listarCursos(filtros), [filtros.q, filtros.pagina]);
 *
 * - `carregando`: primeira carga (sem dados ainda) -> mostre o skeleton.
 * - `atualizando`: recarga com dados já na tela (troca de filtro/período) ->
 *   mantenha o conteúdo e indique de forma discreta. Evita "piscar" a página.
 * - `recarregar()`: busca de novo (ex.: depois de criar um registro).
 * - `setDados`: atualização otimista local.
 *
 * As dependências devem ser valores simples (string, número, booleano).
 */
export default function useApi(funcao, dependencias = []) {
  const [versao, setVersao] = useState(0);
  // `chave` identifica a requisição atual; o estado guarda a chave da última concluída.
  const chave = JSON.stringify([...dependencias, versao]);
  const [estado, setEstado] = useState({ dados: null, erro: null, chave: null });
  const funcaoRef = useRef(funcao);
  useEffect(() => {
    funcaoRef.current = funcao;
  });

  useEffect(() => {
    let ativo = true;
    funcaoRef
      .current()
      .then((dados) => ativo && setEstado({ dados, erro: null, chave }))
      .catch((erro) => ativo && setEstado((atual) => ({ ...atual, erro, chave })));
    return () => {
      ativo = false;
    };
  }, [chave]);

  const pendente = estado.chave !== chave;
  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  const setDados = useCallback(
    (atualizar) =>
      setEstado((atual) => ({
        ...atual,
        dados: typeof atualizar === 'function' ? atualizar(atual.dados) : atualizar,
      })),
    [],
  );

  return {
    dados: estado.dados,
    erro: pendente ? null : estado.erro,
    carregando: pendente && estado.dados === null,
    atualizando: pendente && estado.dados !== null,
    recarregar,
    setDados,
  };
}
