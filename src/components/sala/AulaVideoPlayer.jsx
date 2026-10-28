import { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Settings,
  Tv,
  Maximize,
  Minimize,
} from 'lucide-react';

export default function AulaVideoPlayer({ aula, onAvancarAula }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(342); // 05:42 em segundos
  const totalDuration = 503; // 08:23 em segundos
  const [volume, setVolume] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const formatarTempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const sec = Math.floor(segundos % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.min(Math.max(clickX / rect.width, 0), 1);
    setCurrentTime(Math.floor(percent * totalDuration));
  };

  const pularTempo = (delta) => {
    setCurrentTime((curr) => Math.min(Math.max(curr + delta, 0), totalDuration));
  };

  const progressPercent = (currentTime / totalDuration) * 100;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#232738] bg-[#090b12] shadow-2xl">
      {/* Container visual do Vídeo / Sala de Palestra */}
      <div className="relative aspect-video w-full overflow-hidden select-none">
        {/* Background fotográfico simulado de aula corporativa com instrutor */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 75% 35%, rgba(67, 120, 240, 0.28), transparent 50%), radial-gradient(ellipse at 30% 60%, rgba(20, 184, 166, 0.2), transparent 60%), linear-gradient(to bottom, rgba(12, 14, 23, 0.4), rgba(8, 10, 18, 0.95))',
            backgroundColor: '#0c0e18',
          }}
        >
          {/* Cenário simulado de auditório com tela de apresentação e palestrante */}
          <div className="absolute inset-0 flex items-center justify-between px-10 opacity-70">
            {/* Telão de slides de Comunicação Estratégica à esquerda */}
            <div className="w-[45%] h-[65%] rounded-lg border border-primary/30 bg-[#121626]/80 p-3 shadow-inner hidden md:block">
              <div className="flex items-center gap-1.5 border-b border-primary/20 pb-2">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-xs uppercase font-bold tracking-wider text-lilac">
                  Comunicação Estratégica & Corporativa
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-3 w-3/4 rounded bg-primary/20" />
                <div className="h-2.5 w-1/2 rounded bg-surface2" />
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-line/40">
                  <div className="h-10 rounded bg-[#1e243a]/70 border border-primary/10" />
                  <div className="h-10 rounded bg-[#1e243a]/70 border border-primary/10" />
                  <div className="h-10 rounded bg-[#1e243a]/70 border border-primary/10" />
                </div>
              </div>
            </div>

            {/* Silhueta / Área do Instrutor com microfone e controle */}
            <div className="relative flex flex-col items-center">
              <div className="relative flex items-center justify-center">
                <div className="h-44 w-44 rounded-full bg-gradient-to-t from-primary/30 to-accent/10 blur-xl opacity-60" />
                <div className="absolute -top-4 text-center">
                  <div className="inline-block rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                    Prof. Tiago Vieira (Ao vivo gravado)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badge HD 1080p com indicador vermelho vivo no canto superior direito */}
        <div className="absolute right-4 top-4 z-20 flex items-center gap-1.5 rounded-md bg-black/65 px-2.5 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-[#f43f5e] animate-pulse" />
          <span>HD 1080p</span>
        </div>

        {/* Botão Play central flutuante para pausar/retomar */}
        <div className="absolute inset-0 z-10 grid place-items-center">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pausar aula' : 'Reproduzir aula'}
            className="grid h-16 w-16 place-items-center rounded-full bg-[#3b82f6]/90 text-white shadow-[0_0_30px_rgba(59,130,246,0.6)] transition-all duration-300 hover:scale-110 active:scale-95"
          >
            {isPlaying ? (
              <Pause size={28} className="fill-current text-white" />
            ) : (
              <Play size={28} className="ml-1 fill-current text-white" />
            )}
          </button>
        </div>

        {/* Barra de Controles Inferior com Scrub Bar */}
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#06070d] via-[#090b14]/90 to-transparent px-4 pb-3 pt-8">
          {/* Barra de Progresso Azul Vibrante (Scrub Bar) */}
          <div
            role="slider"
            aria-valuenow={currentTime}
            aria-valuemin={0}
            aria-valuemax={totalDuration}
            onClick={handleSeek}
            className="group relative h-1.5 w-full cursor-pointer rounded-full bg-white/20 transition-all hover:h-2.5"
          >
            <div
              className="relative h-full rounded-full bg-[#3b82f6] transition-all duration-100 ease-out"
              style={{ width: `${progressPercent}%` }}
            >
              <span className="absolute -right-1.5 -top-1 h-3.5 w-3.5 scale-0 rounded-full bg-white shadow-lg transition-transform group-hover:scale-100" />
            </div>
          </div>

          {/* Botões de Ação do Player */}
          <div className="mt-3 flex items-center justify-between text-white text-xs">
            {/* Lado Esquerdo: Play, Voltar 10s, Avançar 10s, Volume, Timer */}
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="rounded p-1 text-white/90 hover:text-white transition-colors"
                aria-label={isPlaying ? 'Pausar' : 'Play'}
              >
                {isPlaying ? <Pause size={17} /> : <Play size={17} className="fill-current" />}
              </button>

              <button
                type="button"
                onClick={() => pularTempo(-10)}
                className="flex items-center gap-0.5 rounded p-1 text-white/80 hover:text-white transition-colors"
                aria-label="Voltar 10 segundos"
              >
                <RotateCcw size={15} />
                <span className="text-xs font-bold">10</span>
              </button>

              <button
                type="button"
                onClick={() => pularTempo(10)}
                className="flex items-center gap-0.5 rounded p-1 text-white/80 hover:text-white transition-colors"
                aria-label="Avançar 10 segundos"
              >
                <RotateCw size={15} />
                <span className="text-xs font-bold">10</span>
              </button>

              {/* Controle de Volume */}
              <div className="flex items-center gap-2 group">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="rounded p-1 text-white/80 hover:text-white transition-colors"
                  aria-label={isMuted ? 'Desmutar' : 'Mutar áudio'}
                >
                  {isMuted || volume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                </button>
                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const v = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                    setVolume(Math.max(0, Math.min(100, v)));
                    setIsMuted(false);
                  }}
                  className="h-1.5 w-14 cursor-pointer rounded-full bg-white/20 hidden sm:block overflow-hidden"
                >
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{ width: `${isMuted ? 0 : volume}%` }}
                  />
                </div>
              </div>

              {/* Contador de Tempo */}
              <span className="font-mono text-xs font-medium text-white/90 ml-1">
                {formatarTempo(currentTime)} / {formatarTempo(totalDuration)}
              </span>
            </div>

            {/* Lado Direito: Engrenagem, Picture-in-Picture, Fullscreen */}
            <div className="flex items-center gap-3 text-white/80">
              <button
                type="button"
                className="rounded p-1 hover:text-white transition-colors"
                aria-label="Configurações de vídeo"
                title="Qualidade e Velocidade"
              >
                <Settings size={16} />
              </button>

              <button
                type="button"
                className="rounded p-1 hover:text-white transition-colors hidden sm:block"
                aria-label="Modo Picture-in-Picture"
                title="Mini-player"
              >
                <Tv size={16} />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="rounded p-1 hover:text-white transition-colors"
                aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
