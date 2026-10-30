import { useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, CheckCheck } from 'lucide-react';
import { cn } from '../../lib/cn';
import { relativo } from '../../lib/formatadores';
import useApi from '../../hooks/useApi';
import { usePopover } from '../../hooks/utilitarios';
import { listarNotificacoes, marcarNotificacaoLida, marcarTodasNotificacoesLidas } from '../../services/api';

/** Sino com contador de não lidas + painel de notificações. */
export default function Notificacoes() {
  const { aberto, setAberto, alternar, containerRef, gatilhoRef } = usePopover();
  const { dados, setDados } = useApi(listarNotificacoes);
  const navigate = useNavigate();
  const painelId = useId();
  const lista = dados ?? [];
  const naoLidas = lista.filter((n) => !n.lida).length;

  const abrir = (n) => {
    if (!n.lida) {
      setDados((atual) => atual.map((x) => (x.id === n.id ? { ...x, lida: true } : x)));
      marcarNotificacaoLida(n.id).catch(() => {});
    }
    setAberto(false);
    if (n.link) navigate(n.link);
  };

  const lerTodas = () => {
    setDados((atual) => atual.map((x) => ({ ...x, lida: true })));
    marcarTodasNotificacoesLidas().catch(() => {});
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={gatilhoRef}
        type="button"
        onClick={alternar}
        aria-expanded={aberto}
        aria-controls={painelId}
        aria-label={naoLidas ? `Notificações: ${naoLidas} não lidas` : 'Notificações'}
        className="relative grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <Bell size={20} aria-hidden />
        {naoLidas > 0 && (
          <span
            aria-hidden
            className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.625rem] font-bold leading-none text-onaccent ring-2 ring-bg"
          >
            {naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div
          id={painelId}
          role="region"
          aria-label="Notificações"
          className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-pop-in overflow-hidden rounded-xl border border-line bg-surface shadow-popover"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold">Notificações</h2>
            {naoLidas > 0 && (
              <button
                type="button"
                onClick={lerTodas}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <CheckCheck size={14} aria-hidden />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {lista.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-10 text-center text-sm text-muted">
              <BellOff size={22} aria-hidden className="mb-2" />
              Nenhuma notificação por enquanto.
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {lista.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => abrir(n)}
                    className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-surface2"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        n.lida ? 'bg-transparent' : 'bg-accent',
                      )}
                    />
                    <span className="min-w-0">
                      <span className={cn('block text-sm', n.lida ? 'text-muted' : 'font-semibold text-ink')}>
                        {!n.lida && <span className="sr-only">Não lida: </span>}
                        {n.titulo}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted">{n.descricao}</span>
                      <span className="mt-1 block text-xs text-subtle">{relativo(n.criadaEm)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
