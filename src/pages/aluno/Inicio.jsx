import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ListChecks, Play } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { getInicio } from '../../services/api';
import { duracao } from '../../lib/formatadores';
import Pagina, { Secao } from '../../components/ui/Pagina';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import Thumbnail from '../../components/ui/Thumbnail';
import { Carregando, ErroCarregamento, Skeleton, Vazio } from '../../components/ui/Estados';
import AtividadeCard from '../../components/atividades/AtividadeCard';

function InicioSkeleton() {
  return (
    <Carregando rotulo="Carregando sua página inicial…" className="mx-auto max-w-5xl">
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 max-w-full" />
      </div>
      <Card espacamento="lg" className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-video" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-12 w-48" />
        </div>
      </Card>
      <div className="grid gap-10 lg:grid-cols-2">
        {[0, 1].map((c) => (
          <div key={c} className="space-y-3">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        ))}
      </div>
    </Carregando>
  );
}

/** Ação principal da tela: retomar a aula de onde parou. */
function ContinuarCard({ continuar }) {
  const destino = `/cursos/${continuar.curso.id}/aulas/${continuar.aula.id}`;
  return (
    <Card
      as="section"
      espacamento="lg"
      aria-labelledby="continuar-titulo"
      className="grid gap-6 md:grid-cols-2 md:items-center md:gap-8"
    >
      {/* O pôster é atalho de mouse; teclado/leitor de tela usam o botão (evita foco duplicado). */}
      <Link to={destino} tabIndex={-1} aria-hidden className="group block rounded-xl">
        <Thumbnail imagem={continuar.imagemUrl} tema={continuar.tema} className="aspect-video rounded-xl">
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-primary text-onprimary shadow-glow transition-transform duration-300 ease-suave group-hover:scale-110">
              <Play size={24} className="ml-0.5 fill-current" />
            </span>
          </span>
        </Thumbnail>
      </Link>

      <div>
        <p className="text-sm font-semibold text-primary">Continue de onde parou</p>
        <h2 id="continuar-titulo" className="mt-2 text-2xl font-semibold leading-snug">
          {continuar.aula.titulo}
        </h2>
        <p className="mt-1 text-base text-muted">
          {continuar.curso.titulo} · Aula {continuar.aula.ordem}
        </p>
        <ProgressBar
          valor={continuar.percentualAssistido}
          altura="h-2"
          className="mt-6"
          rotulo="Progresso da aula"
        />
        <p className="mt-2 text-sm text-muted">Faltam {duracao(continuar.minutosRestantes)}</p>
        <Button to={destino} tamanho="lg" className="mt-6" iconeDireita={ArrowRight}>
          Continuar aula
        </Button>
      </div>
    </Card>
  );
}

function CursoEmAndamento({ curso }) {
  return (
    <Card interativo className="relative focus-within:ring-2 focus-within:ring-primary/70">
      <h3 className="text-base font-semibold leading-snug">
        <Link
          to={`/cursos/${curso.id}`}
          className="after:absolute after:inset-0 after:rounded-2xl focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          {curso.titulo}
        </Link>
      </h3>
      <div className="mt-3 flex items-center gap-4">
        <ProgressBar valor={curso.progresso} altura="h-2" rotulo={`Progresso em ${curso.titulo}`} />
        <span className="shrink-0 text-sm font-medium tabular-nums text-muted">{curso.progresso}%</span>
      </div>
    </Card>
  );
}

/**
 * Início do aluno. Hierarquia: 1) saudação + meta  2) retomar aula (ação
 * principal)  3) cursos em andamento  4) próximas atividades.
 */
export default function Inicio() {
  const { dados, carregando, erro, recarregar, setDados } = useApi(getInicio);

  if (carregando) return <InicioSkeleton />;
  if (erro) return <ErroCarregamento erro={erro} onTentarNovamente={recarregar} className="mt-10" />;

  const { usuario, metaSemanal, continuar, cursosEmAndamento, atividades } = dados;
  const horas = (m) => (m / 60).toLocaleString('pt-BR', { maximumFractionDigits: 1 });
  const metaPct = Math.round((metaSemanal.minutosEstudados / metaSemanal.minutosMeta) * 100);

  const aoEntregar = (atualizada) =>
    setDados((d) => ({
      ...d,
      atividades: d.atividades.map((a) => (a.id === atualizada.id ? { ...a, ...atualizada } : a)),
    }));

  return (
    <Pagina
      titulo={`Olá, ${usuario.nome}`}
      tituloAba="Início"
      descricao={
        <>
          Meta da semana:{' '}
          <strong className="font-semibold text-ink">
            {horas(metaSemanal.minutosEstudados)} de {horas(metaSemanal.minutosMeta)} horas
          </strong>
          {metaPct >= 100 ? ' — meta batida!' : ` (${metaPct}%)`}
        </>
      }
      className="space-y-12"
    >
      {continuar ? (
        <ContinuarCard continuar={continuar} />
      ) : (
        <Vazio
          icone={Compass}
          titulo="Você ainda não começou nenhum curso"
          descricao="Escolha um curso ou trilha para começar. Seu progresso aparece aqui."
          acao={<Button to="/explorar">Explorar cursos</Button>}
        />
      )}

      <div className="grid gap-10 lg:grid-cols-2">
        <Secao
          titulo="Cursos em andamento"
          acao={
            <Link
              to="/progresso"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Ver meu progresso
            </Link>
          }
        >
          {cursosEmAndamento.length ? (
            <ul className="space-y-3">
              {cursosEmAndamento.map((curso) => (
                <li key={curso.id}>
                  <CursoEmAndamento curso={curso} />
                </li>
              ))}
            </ul>
          ) : (
            <Vazio
              titulo="Nenhum curso em andamento"
              acao={
                <Button to="/explorar" variante="secondary">
                  Explorar cursos
                </Button>
              }
            />
          )}
        </Secao>

        <Secao titulo="Próximas atividades">
          {atividades.length ? (
            <ul className="space-y-3">
              {atividades.map((a) => (
                <li key={a.id}>
                  <AtividadeCard atividade={a} mostrarCurso onEntregue={aoEntregar} />
                </li>
              ))}
            </ul>
          ) : (
            <Vazio icone={ListChecks} titulo="Tudo em dia" descricao="Você não tem atividades pendentes." />
          )}
        </Secao>
      </div>
    </Pagina>
  );
}
