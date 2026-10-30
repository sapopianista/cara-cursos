import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Send } from 'lucide-react';
import { cn } from '../../lib/cn';
import { dataCurta, diasAte } from '../../lib/formatadores';
import { STATUS_ATIVIDADE } from '../../lib/rotulos';
import useMutacao from '../../hooks/useMutacao';
import { entregarAtividade } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { CampoArea } from '../ui/Campo';
import { StatusBadge } from '../ui/Badge';

/** "Vence hoje" · "Vence amanhã" · "Vence em 5 dias" · "Atrasada há 2 dias" */
export function descreverPrazo(prazo) {
  const dias = diasAte(prazo);
  if (dias < 0) return { texto: `Atrasada há ${-dias} ${dias === -1 ? 'dia' : 'dias'}`, urgente: true };
  if (dias === 0) return { texto: 'Vence hoje', urgente: true };
  if (dias === 1) return { texto: 'Vence amanhã', urgente: true };
  return { texto: `Vence em ${dias} dias`, urgente: dias <= 2 };
}

/**
 * Atividade prática (mesma aparência e mesmo fluxo de entrega no Início e na
 * Sala de aula). A urgência é dita em texto, não só por cor.
 */
export default function AtividadeCard({
  atividade,
  onEntregue,
  mostrarCurso = false,
  mostrarDescricao = false,
}) {
  const [modalAberto, setModalAberto] = useState(false);
  const [resposta, setResposta] = useState('');
  const { executar, executando, erro, errosCampos } = useMutacao(entregarAtividade);
  const toast = useToast();
  const entregue = atividade.status === 'entregue';
  const prazo = descreverPrazo(atividade.prazo);

  const enviar = async (e) => {
    e.preventDefault();
    const atualizada = await executar(atividade.id, { resposta });
    if (!atualizada) return;
    setModalAberto(false);
    setResposta('');
    toast.sucesso('Atividade entregue. O instrutor será avisado.');
    onEntregue?.(atualizada);
  };

  return (
    <Card espacamento="md" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {mostrarCurso && atividade.curso && (
          <Link
            to={`/cursos/${atividade.curso.id}`}
            className="text-sm text-muted hover:text-primary hover:underline"
          >
            {atividade.curso.titulo}
          </Link>
        )}
        <h3 className="mt-0.5 text-base font-semibold leading-snug text-ink">{atividade.titulo}</h3>
        {mostrarDescricao && <p className="mt-1 text-sm text-muted">{atividade.descricao}</p>}
        {!entregue && (
          <p
            className={cn(
              'mt-1.5 flex items-center gap-1.5 text-sm',
              prazo.urgente ? 'font-semibold text-warn' : 'text-muted',
            )}
          >
            <CalendarClock size={15} aria-hidden />
            {prazo.texto} · {dataCurta(atividade.prazo)}
          </p>
        )}
      </div>

      <div className="shrink-0">
        {entregue ? (
          <StatusBadge mapa={STATUS_ATIVIDADE} valor="entregue" />
        ) : (
          <Button
            variante={prazo.urgente ? 'primary' : 'secondary'}
            iconeEsquerda={Send}
            onClick={() => setModalAberto(true)}
          >
            Entregar
          </Button>
        )}
      </div>

      <Modal
        aberto={modalAberto}
        onFechar={() => !executando && setModalAberto(false)}
        titulo="Entregar atividade"
        descricao={atividade.titulo}
        rodape={
          <>
            <Button variante="ghost" onClick={() => setModalAberto(false)} disabled={executando}>
              Cancelar
            </Button>
            <Button type="submit" form={`entrega-${atividade.id}`} carregando={executando}>
              Entregar atividade
            </Button>
          </>
        }
      >
        <form id={`entrega-${atividade.id}`} onSubmit={enviar} noValidate className="space-y-4">
          {atividade.descricao && (
            <p className="rounded-xl bg-surface2 p-3.5 text-sm text-muted">{atividade.descricao}</p>
          )}
          <CampoArea
            rotulo="Sua resposta"
            obrigatorio
            rows={6}
            data-autofocus
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            erro={errosCampos.resposta}
            dica="Depois de entregue, a resposta não pode ser editada."
          />
          {erro && !errosCampos.resposta && (
            <p role="alert" className="text-sm text-danger">
              {erro.message}
            </p>
          )}
        </form>
      </Modal>
    </Card>
  );
}
