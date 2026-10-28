import { useEffect, useState } from 'react';

/**
 * Hook genérico de carregamento de dados.
 *   const { dados, carregando, erro } = useApi(getDashboardAluno);
 */
export default function useApi(funcao, dependencias = []) {
  const [estado, setEstado] = useState({ dados: null, carregando: true, erro: null });

  useEffect(() => {
    let ativo = true;
    setEstado((atual) => ({ ...atual, carregando: true, erro: null }));

    funcao()
      .then((dados) => ativo && setEstado({ dados, carregando: false, erro: null }))
      .catch((erro) => ativo && setEstado({ dados: null, carregando: false, erro }));

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias);

  return estado;
}
