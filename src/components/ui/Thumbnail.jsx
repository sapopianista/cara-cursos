import { cn } from '../../lib/cn';

/**
 * Gradientes que substituem as capas enquanto a API não fornece `imagem`.
 * (Strings estáticas para o Tailwind detectar as classes.)
 */
const TEMAS = {
  azul: 'from-[#2a5db0] via-[#16305f] to-[#0a1226]',
  ambar: 'from-[#8a6a3a] via-[#3b2f24] to-[#14151c]',
  ciano: 'from-[#1e6f8c] via-[#123249] to-[#0a1424]',
  roxo: 'from-[#6a4bb8] via-[#2b2159] to-[#0e0c24]',
  teal: 'from-[#11847a] via-[#0c4448] to-[#071a1e]',
  verde: 'from-[#2f8f5b] via-[#17402e] to-[#0a1712]',
  rosa: 'from-[#b04a7a] via-[#4d1f3a] to-[#160b14]',
  grafite: 'from-[#4b5568] via-[#262c3a] to-[#0f1219]',
  laranja: 'from-[#c2662d] via-[#5a2c17] to-[#170c08]',
};

export const TEMAS_DISPONIVEIS = Object.keys(TEMAS);

/** Capa de curso/vídeo: usa `imagem` se existir, senão um gradiente temático. */
export default function Thumbnail({ imagem, tema = 'azul', alt = '', className, imgClassName, children }) {
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br', TEMAS[tema] ?? TEMAS.azul, className)}>
      {imagem ? (
        <img
          src={imagem}
          alt={alt}
          loading="lazy"
          className={cn('absolute inset-0 h-full w-full object-cover', imgClassName)}
        />
      ) : (
        <div
          aria-hidden
          className={cn('absolute inset-0 opacity-60', imgClassName)}
          style={{
            backgroundImage:
              'radial-gradient(circle at 70% 25%, rgb(255 255 255 / .22), transparent 45%), linear-gradient(rgb(255 255 255 / .05) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / .05) 1px, transparent 1px)',
            backgroundSize: 'auto, 18px 18px, 18px 18px',
          }}
        />
      )}
      {children}
    </div>
  );
}
