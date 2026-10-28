import { useState } from 'react';
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Tv,
  Volume2,
  VolumeX,
} from 'lucide-react';
import Thumbnail from '../ui/Thumbnail';

export default function VideoPlayer({ qualidade = 'HD 1080p', titulo }) {
  const [tocando, setTocando] = useState(false);
  const [mutado, setMutado] = useState(false);
  const [progresso, setProgresso] = useState(68);
  const [telaCheia, setTelaCheia] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-black shadow-2xl">
      {/* Área do Vídeo / Poster */}
      <Thumbnail
        tema="azul"
        className="relative aspect-video w-full transition-transform duration-500"
      >
        {/* Camada de escurecimento para controles */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />

        {/* Badge HD 1080p */}
        <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-danger animate-pulse" />
          {qualidade}
        </div>

        {/* Botão Central de Play/Pause */}
        <div className="absolute inset-0 grid place-items-center">
          <button
            type="button"
            onClick={() => setTocando(!tocando)}
            aria-label={tocando ? 'Pausar aula' : 'Reproduzir aula'}
            className="grid h-16 w-16 place-items-center rounded-full bg-primary/90 text-onprimary shadow-glow transition-all duration-300 hover:scale-110 active:scale-95"
          >
            {tocando ? (
              <Pause size={26} className="fill-current" />
            ) : (
              <Play size={26} className="ml-1 fill-current" />
            )}
          </button>
        </div>

        {/* Barra de Controles Inferiores */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          {/* Linha da barra de progresso do vídeo (clicável) */}
          <div
            className="group relative h-1.5 w-full cursor-pointer rounded-full bg-white/20 transition-all hover:h-2.5"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
              setProgresso(Math.max(0, Math.min(100, pct)));
            }}
          >
            <div
              className="relative h-full rounded-full bg-primary"
              style={{ width: `${progresso}%` }}
            >
              <span className="absolute -right-1.5 -top-1 h-3.5 w-3.5 rounded-full bg-white shadow opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Botões de Ação do Player */}
          <div className="mt-3 flex items-center justify-between text-white text-xs">
            {/* Esquerda: Play, Voltar 10s, Avançar 10s, Volume, Tempo */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setTocando(!tocando)}
                className="rounded p-1 text-white/90 hover:text-white"
                aria-label={tocando ? 'Pausar' : 'Play'}
              >
                {tocando ? <Pause size={17} /> : <Play size={17} className="fill-current" />}
              </button>

              <button
                type="button"
                onClick={() => setProgresso((p) => Math.max(0, p - 5))}
                className="rounded p-1 text-white/80 hover:text-white flex items-center gap-0.5 text-xs"
                aria-label="Voltar 10 segundos"
              >
                <RotateCcw size={15} />
                <span>10</span>
              </button>

              <button
                type="button"
                onClick={() => setProgresso((p) => Math.min(100, p + 5))}
                className="rounded p-1 text-white/80 hover:text-white flex items-center gap-0.5 text-xs"
                aria-label="Avançar 10 segundos"
              >
                <RotateCw size={15} />
                <span>10</span>
              </button>

              <button
                type="button"
                onClick={() => setMutado(!mutado)}
                className="rounded p-1 text-white/80 hover:text-white"
                aria-label={mutado ? 'Ativar som' : 'Silenciar'}
              >
                {mutado ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>

              <span className="font-mono text-xs text-white/80">
                05:42 / 08:23
              </span>
            </div>

            {/* Direita: Engrenagem, PiP, Tela Cheia */}
            <div className="flex items-center gap-3 text-white/80">
              <button
                type="button"
                className="rounded p-1 hover:text-white"
                aria-label="Configurações de vídeo"
              >
                <Settings size={16} />
              </button>
              <button
                type="button"
                className="rounded p-1 hover:text-white hidden sm:block"
                aria-label="Picture-in-picture"
              >
                <Tv size={16} />
              </button>
              <button
                type="button"
                onClick={() => setTelaCheia(!telaCheia)}
                className="rounded p-1 hover:text-white"
                aria-label={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
              >
                {telaCheia ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>
          </div>
        </div>
      </Thumbnail>
    </div>
  );
}
