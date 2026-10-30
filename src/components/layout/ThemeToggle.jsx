import { Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useTema } from '../../context/TemaContext';

/** Interruptor de tema (mesmo visual do componente Switch). */
export default function ThemeToggle({ className }) {
  const { escuro, alternar } = useTema();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={escuro}
      onClick={alternar}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-ink',
        className,
      )}
    >
      <span className="flex items-center gap-2">
        {escuro ? <Moon size={16} aria-hidden /> : <Sun size={16} aria-hidden />}
        Modo escuro
      </span>
      <span
        aria-hidden
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200',
          escuro ? 'border-primary bg-primary' : 'border-line bg-track',
        )}
      >
        <span
          className={cn(
            'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ease-suave',
            escuro ? 'translate-x-[18px]' : 'translate-x-[2px]',
          )}
        />
      </span>
    </button>
  );
}
