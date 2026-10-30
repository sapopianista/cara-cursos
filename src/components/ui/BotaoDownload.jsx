import { useState } from 'react';
import { Clock, Download } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import Button from './Button';

/**
 * Download de arquivo vindo da API.
 * Quando o arquivo ainda não existe (`disponivel=false`: URL ausente, relatório
 * processando, servidor não conectado), mostra o motivo em texto — nunca um
 * botão que finge baixar.
 */
export default function BotaoDownload({
  onBaixar,
  disponivel = true,
  rotulo = 'Baixar',
  rotuloIndisponivel = 'Arquivo indisponível',
  variante = 'outline',
  tamanho = 'sm',
  className,
  ...rest
}) {
  const [baixando, setBaixando] = useState(false);
  const toast = useToast();

  if (!disponivel) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-subtle">
        <Clock size={14} aria-hidden />
        {rotuloIndisponivel}
      </span>
    );
  }

  const baixar = async () => {
    setBaixando(true);
    try {
      await onBaixar();
    } catch (erro) {
      toast.erro(erro.message || 'Não foi possível baixar o arquivo.');
    } finally {
      setBaixando(false);
    }
  };

  return (
    <Button
      variante={variante}
      tamanho={tamanho}
      iconeEsquerda={Download}
      carregando={baixando}
      onClick={baixar}
      className={className}
      {...rest}
    >
      {rotulo}
    </Button>
  );
}
