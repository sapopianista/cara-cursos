import useApi from '../../../hooks/useApi';
import { useTituloPagina } from '../../../hooks/utilitarios';
import { getRecomendacoes } from '../../../services/api';
import CursoCard from '../../../components/cursos/CursoCard';
import { Secao } from '../../../components/ui/Pagina';
import { ErroCarregamento, SkeletonPagina } from '../../../components/ui/Estados';

function Lista({ itens }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {itens.map(({ curso, motivo }) => (
        <li key={curso.id}>
          <CursoCard curso={curso} motivo={motivo} />
        </li>
      ))}
    </ul>
  );
}

/** Recomendações. Cada card diz POR QUE foi recomendado (em vez de um "98% compatível" sem explicação). */
export default function ParaVoce() {
  useTituloPagina('Para você');
  const { dados, carregando, erro, recarregar } = useApi(getRecomendacoes);

  if (carregando) return <SkeletonPagina cabecalho={false} largura="max-w-none" />;
  if (erro) return <ErroCarregamento erro={erro} onTentarNovamente={recarregar} />;

  const { perfil, porCargo, continuidade } = dados;

  return (
    <div className="space-y-12">
      <Secao
        titulo="Para o seu cargo"
        descricao={
          <>
            Com base no seu cargo de <strong className="font-semibold text-ink">{perfil.cargo}</strong> em{' '}
            {perfil.departamento}.
          </>
        }
      >
        <Lista itens={porCargo} />
      </Secao>

      <Secao
        titulo="Próximos passos"
        descricao={`Complementam o curso “${continuidade.baseadoEm}”, que você concluiu.`}
      >
        <Lista itens={continuidade.cursos} />
      </Secao>
    </div>
  );
}
