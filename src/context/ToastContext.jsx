import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import { cn } from '../lib/cn';

const ToastContext = createContext(null);

const ESTILOS = {
  sucesso: { icone: CheckCircle2, cor: 'text-accent' },
  erro: { icone: CircleAlert, cor: 'text-danger' },
  info: { icone: Info, cor: 'text-primary' },
};

/**
 * Avisos temporários no canto da tela (não empurram o layout).
 *   const toast = useToast();
 *   toast.sucesso('Colaborador cadastrado.');
 *   toast.erro(erro.message);
 */
export function ToastProvider({ children }) {
  const [itens, setItens] = useState([]);
  const contador = useRef(0);

  const fechar = useCallback((id) => {
    setItens((lista) => lista.map((t) => (t.id === id ? { ...t, saindo: true } : t)));
    setTimeout(() => setItens((lista) => lista.filter((t) => t.id !== id)), 180);
  }, []);

  const mostrar = useCallback(
    (tipo, mensagem, { duracao = tipo === 'erro' ? 7000 : 4500, acao } = {}) => {
      const id = ++contador.current;
      setItens((lista) => [...lista.slice(-3), { id, tipo, mensagem, acao }]);
      if (duracao) setTimeout(() => fechar(id), duracao);
      return id;
    },
    [fechar],
  );

  const api = useMemo(
    () => ({
      sucesso: (msg, op) => mostrar('sucesso', msg, op),
      erro: (msg, op) => mostrar('erro', msg, op),
      info: (msg, op) => mostrar('info', msg, op),
      fechar,
    }),
    [mostrar, fechar],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Região sempre presente: leitores de tela anunciam o que entra nela. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
      >
        {itens.map(({ id, tipo, mensagem, acao, saindo }) => {
          const { icone: Icone, cor } = ESTILOS[tipo];
          return (
            <div
              key={id}
              role={tipo === 'erro' ? 'alert' : 'status'}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface p-4 text-sm text-ink shadow-popover',
                saindo ? 'animate-fade-out' : 'animate-toast-in',
              )}
            >
              <Icone size={18} className={cn('mt-0.5 shrink-0', cor)} aria-hidden />
              <p className="flex-1 leading-snug">{mensagem}</p>
              {acao && (
                <button
                  type="button"
                  onClick={() => {
                    acao.onClick();
                    fechar(id);
                  }}
                  className="shrink-0 font-semibold text-primary hover:underline"
                >
                  {acao.rotulo}
                </button>
              )}
              <button
                type="button"
                onClick={() => fechar(id)}
                aria-label="Fechar aviso"
                className="-m-1 shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-surface2 hover:text-ink"
              >
                <X size={15} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>.');
  return ctx;
}
