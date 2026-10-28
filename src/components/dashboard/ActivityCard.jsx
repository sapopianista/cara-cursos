import { useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import { enviarAtividade } from '../../services/api';
import Card from '../ui/Card';

/**
 * Atividade pendente. Urgência é comunicada por texto ("Urgente"), não só
 * por cor. O botão só existe quando há uma ação real a executar.
 */
export default function ActivityCard({ atividade }) {
  const { id, curso, titulo, diasRestantes, entrega, acao } = atividade;
  const [estado, setEstado] = useState('pendente'); // pendente | enviando | enviado | erro
  const urgente = diasRestantes <= 2;

  const enviar = async () => {
    setEstado('enviando');
    try {
      await enviarAtividade(id);
      setEstado('enviado');
    } catch {
      setEstado('erro');
    }
  };

  return (
    <Card className="!p-5">
      <p className="text-sm text-muted">{curso}</p>
      <h3 className="mt-1 text-base font-semibold leading-snug">{titulo}</h3>
      <p className="mt-2 text-sm text-muted">
        {urgente && <span className="font-semibold text-warn">Urgente · </span>}
        Entrega em {entrega} ({diasRestantes} dias)
      </p>

      {acao === 'enviar' && (
        <div className="mt-4">
          {estado === 'enviado' ? (
            <p role="status" className="flex items-center gap-2 text-sm font-semibold text-accent">
              <Check size={16} aria-hidden />
              Tarefa enviada
            </p>
          ) : (
            <button
              type="button"
              onClick={enviar}
              disabled={estado === 'enviando'}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-onprimary transition-all hover:brightness-110 active:scale-[0.97] disabled:opacity-70"
            >
              {estado === 'enviando' && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
              {estado === 'enviando' ? 'Enviando…' : 'Enviar tarefa'}
            </button>
          )}
          {estado === 'erro' && (
            <p role="alert" className="mt-2 text-sm text-danger">
              Não foi possível enviar. Tente novamente.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
