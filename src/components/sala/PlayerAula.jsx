import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, RotateCcw, SkipForward, VideoOff } from 'lucide-react';
import Button from '../ui/Button';

const INTERVALO_SALVAR_MS = 15_000;

/**
 * Player da aula: <video> nativo (controles acessíveis por teclado e leitor de
 * tela, tela cheia, PiP e velocidade já inclusos no navegador).
 *
 * - Retoma em `aula.posicaoSegundos`.
 * - Salva a posição a cada 15s, ao pausar e ao sair (onSalvarPosicao).
 * - Ao terminar, chama `onTerminar` e oferece "Próxima aula".
 * Use com key={aula.id} para reiniciar o estado a cada aula.
 */
export default function PlayerAula({ aula, onSalvarPosicao, onTerminar, proximaAula, onProxima }) {
  const videoRef = useRef(null);
  const ultimoSalvo = useRef(0);
  const [falhou, setFalhou] = useState(false);
  const [terminou, setTerminou] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  const salvar = (forcar = false) => {
    const v = videoRef.current;
    if (!v || !v.currentTime) return;
    const agora = Date.now();
    if (forcar || agora - ultimoSalvo.current >= INTERVALO_SALVAR_MS) {
      ultimoSalvo.current = agora;
      onSalvarPosicao?.(v.currentTime);
    }
  };

  // Ao sair da aula (o pai remonta o player com key={aula.id}), salva a posição.
  useEffect(() => {
    const v = videoRef.current;
    return () => {
      if (v?.currentTime) onSalvarPosicao?.(v.currentTime);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aoCarregar = () => {
    const v = videoRef.current;
    // Só retoma se a posição salva for válida para este arquivo.
    if (v && aula.posicaoSegundos > 0 && aula.posicaoSegundos < v.duration - 3) {
      v.currentTime = aula.posicaoSegundos;
    }
  };

  const aoTerminar = () => {
    setTerminou(true);
    salvar(true);
    onTerminar?.();
  };

  const assistirDeNovo = () => {
    setTerminou(false);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-player shadow-card">
      <div className="relative aspect-video w-full">
        {falhou ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <VideoOff size={28} aria-hidden className="text-white/70" />
            <p className="font-semibold">Não foi possível carregar o vídeo.</p>
            <p className="max-w-sm text-sm text-white/70">
              Verifique sua conexão. Se o problema continuar, abra um chamado no Suporte.
            </p>
            <Button
              variante="secondary"
              tamanho="sm"
              iconeEsquerda={RotateCcw}
              onClick={() => (setFalhou(false), setTentativa((t) => t + 1))}
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <video
            key={`${aula.id}-${tentativa}`}
            ref={videoRef}
            src={aula.videoUrl}
            poster={aula.posterUrl ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full bg-player"
            aria-label={`Vídeo da aula: ${aula.titulo}`}
            onLoadedMetadata={aoCarregar}
            onTimeUpdate={() => salvar()}
            onPause={() => salvar(true)}
            onEnded={aoTerminar}
            onError={() => setFalhou(true)}
          >
            {aula.legendaUrl && (
              <track kind="captions" src={aula.legendaUrl} srcLang="pt-BR" label="Português" default />
            )}
          </video>
        )}

        {terminou && (
          <div
            role="status"
            className="absolute inset-0 flex animate-fade-in flex-col items-center justify-center gap-4 bg-black/80 p-6 text-center text-white backdrop-blur-sm"
          >
            <CheckCircle2 size={36} className="text-accent" aria-hidden />
            <p className="text-lg font-semibold">Aula concluída</p>
            {proximaAula && <p className="text-sm text-white/75">A seguir: {proximaAula.titulo}</p>}
            <div className="flex flex-wrap justify-center gap-2">
              <Button variante="secondary" tamanho="sm" iconeEsquerda={RotateCcw} onClick={assistirDeNovo}>
                Assistir de novo
              </Button>
              {proximaAula && (
                <Button tamanho="sm" iconeDireita={SkipForward} onClick={onProxima} data-autofocus>
                  Próxima aula
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
