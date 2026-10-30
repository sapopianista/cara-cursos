import { Compass } from 'lucide-react';
import { useTituloPagina } from '../hooks/utilitarios';
import Button from '../components/ui/Button';

/** 404 dentro do layout: o usuário continua com o menu para se orientar. */
export default function NaoEncontrada({ inicio = '/' }) {
  useTituloPagina('Página não encontrada');
  return (
    <div className="grid min-h-[60vh] animate-entrada place-items-center px-4">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Compass size={24} aria-hidden />
        </span>
        <p className="mt-5 text-sm font-semibold text-primary">Erro 404</p>
        <h1 className="mt-1 text-2xl font-bold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted">
          O endereço pode estar incorreto ou a página foi movida. Use o menu ao lado ou volte ao início.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button to={inicio}>Voltar ao início</Button>
          {inicio === '/' && (
            <Button to="/explorar" variante="secondary">
              Explorar cursos
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
