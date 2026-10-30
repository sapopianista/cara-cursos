import Pagina from '../../components/ui/Pagina';
import CentralSuporte from '../../components/suporte/CentralSuporte';

export default function Suporte() {
  return (
    <Pagina
      titulo="Suporte"
      descricao="Veja as dúvidas mais comuns ou fale com a equipe pedagógica e técnica."
    >
      <CentralSuporte escopo="aluno" />
    </Pagina>
  );
}
