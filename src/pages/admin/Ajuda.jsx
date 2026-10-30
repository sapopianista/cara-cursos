import Pagina from '../../components/ui/Pagina';
import CentralSuporte from '../../components/suporte/CentralSuporte';

export default function Ajuda() {
  return (
    <Pagina
      titulo="Ajuda"
      descricao="Orientações para administrar a plataforma e contato com o seu gerente de sucesso."
    >
      <CentralSuporte escopo="gestor" />
    </Pagina>
  );
}
