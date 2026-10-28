import { Moon, Sun } from 'lucide-react';
import useTheme from '../../hooks/useTheme';

/** Interruptor "Modo escuro" do rodapé do menu lateral. */
export default function ThemeToggle() {
  const { escuro, alternar } = useTheme();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={escuro}
      onClick={alternar}
      className="flex w-full items-center justify-between rounded-xl bg-surface px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-ink"
    >
      <span className="flex items-center gap-2">
        {escuro ? <Moon size={15} aria-hidden /> : <Sun size={15} aria-hidden />}
        {escuro ? 'Modo escuro' : 'Modo claro'}
      </span>
      <span
        className={`relative h-5 w-9 rounded-full transition-colors ${escuro ? 'bg-accent' : 'bg-track'}`}
        aria-hidden
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-sidebar shadow transition-all ${escuro ? 'left-[18px]' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}
